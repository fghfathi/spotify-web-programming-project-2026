"""
Recommendations are derived from data the platform already records — the
user's own `StreamEvent` history, who they follow, and what other listeners
with overlapping taste play. Nothing here is random: every candidate gets a
deterministic score from four weighted signals, and every returned song
carries the human-readable reason that dominated its score.

    score(song) = 0.45 * genre_affinity
                + 0.30 * collaborative
                + 0.15 * artist_affinity
                + 0.10 * popularity

`genre_affinity`   share of the user's plays that fall in the song's genre.
`collaborative`    plays of the song by listeners whose history overlaps the
                   user's, weighted by how much overlap each listener has.
`artist_affinity`  share of the user's plays that belong to the song's artist,
                   plus a fixed bonus when the user follows that artist.
`popularity`       log-scaled global play count, normalized to the candidate
                   set. Breaks ties and carries the cold-start case.

Every component is normalized to [0, 1], so the weights are the whole story.

Cold start: a user with no play history gets `genre_affinity` and
`collaborative` of zero, which leaves followed artists and popularity — the
best available evidence — rather than a random shuffle.
"""

import math
from collections import defaultdict

from django.db.models import Count, Q
from django.utils import timezone

from apps.accounts.models import Follow
from apps.catalog.models import Song
from apps.streaming.models import StreamEvent

# Signal weights. They sum to 1.0, so a score is directly comparable to 1.
W_GENRE = 0.45
W_COLLAB = 0.30
W_ARTIST = 0.15
W_POPULARITY = 0.10

# A follow is strong evidence of taste, but weaker than a play history full of
# that artist — it tops up artist affinity rather than replacing it.
FOLLOW_BONUS = 0.5

# How many similar listeners to consider. Bounding this keeps the collaborative
# pass to a fixed number of rows no matter how large the platform grows.
MAX_PEERS = 50

# Below this score a suggestion is not defensibly "related to the user's
# taste", so it is dropped rather than padded in.
MIN_SCORE = 0.01


def _normalize(scores: dict) -> dict:
    """Scale a {key: value} map so the largest value becomes 1.0."""
    if not scores:
        return {}
    peak = max(scores.values())
    if peak <= 0:
        return {}
    return {key: value / peak for key, value in scores.items()}


def _genre_affinity(user) -> dict:
    """{genre: share of the user's plays}, summing to 1 across genres."""
    rows = (
        StreamEvent.objects.filter(user=user)
        .exclude(song__genre="")
        .values("song__genre")
        .annotate(plays=Count("id"))
        .order_by()
    )
    total = sum(row["plays"] for row in rows)
    if not total:
        return {}
    return {row["song__genre"]: row["plays"] / total for row in rows}


def _artist_affinity(user) -> dict:
    """{artist_id: share of the user's plays}, topped up by follows."""
    rows = (
        StreamEvent.objects.filter(user=user)
        .values("artist_id")
        .annotate(plays=Count("id"))
        .order_by()
    )
    total = sum(row["plays"] for row in rows)
    affinity = defaultdict(float)
    if total:
        for row in rows:
            affinity[row["artist_id"]] = row["plays"] / total

    followed = Follow.objects.filter(follower=user).values_list("following_id", flat=True)
    for artist_id in followed:
        affinity[artist_id] += FOLLOW_BONUS

    return _normalize(dict(affinity))


def _collaborative(user, played_song_ids: set) -> tuple:
    """Score candidates by what similar listeners play.

    Returns ({song_id: raw score}, {song_id: name of a shared song}) — the
    second map feeds the "listeners who liked X also play this" reason.
    """
    if not played_song_ids:
        return {}, {}

    # Listeners who played at least one of the same songs, ranked by overlap.
    peers = (
        StreamEvent.objects.filter(song_id__in=played_song_ids)
        .exclude(user=user)
        .values("user_id")
        .annotate(overlap=Count("song_id", distinct=True))
        .order_by("-overlap")[:MAX_PEERS]
    )
    peer_weight = {row["user_id"]: row["overlap"] for row in peers}
    if not peer_weight:
        return {}, {}

    # What those listeners play that this user has not heard yet. Each peer
    # contributes its overlap weight once per song — counting distinct
    # (song, peer) pairs rather than raw plays stops one heavy listener with a
    # track on repeat from dominating the ranking.
    rows = (
        StreamEvent.objects.filter(user_id__in=peer_weight.keys())
        .exclude(song_id__in=played_song_ids)
        .values("song_id", "user_id")
        .distinct()
    )
    raw = defaultdict(float)
    for row in rows:
        raw[row["song_id"]] += peer_weight[row["user_id"]]

    return _normalize(dict(raw)), _peer_anchor(user, played_song_ids, peer_weight.keys())


def _peer_anchor(user, played_song_ids: set, peer_ids) -> dict:
    """The song that best explains why these peers were matched to the user.

    It must be a song the peers actually share with the user — naming the
    user's overall favourite would claim a connection that may not exist. Ties
    break on title so the phrasing is stable between requests.
    """
    shared_song_ids = (
        StreamEvent.objects.filter(user_id__in=peer_ids, song_id__in=played_song_ids)
        .values_list("song_id", flat=True)
        .distinct()
    )
    top = (
        StreamEvent.objects.filter(user=user, song_id__in=list(shared_song_ids))
        .values("song_id", "song__title")
        .annotate(plays=Count("id"))
        .order_by("-plays", "song__title")
        .first()
    )
    return {"title": top["song__title"]} if top else {}


def _popularity(candidates) -> dict:
    """Log-scaled global play counts, normalized across the candidate set."""
    raw = {
        song.id: math.log1p(song.play_count)
        for song in candidates
        if song.play_count > 0
    }
    return _normalize(raw)


def _visible_candidates(user, played_song_ids: set):
    """Songs the user could actually play, excluding ones already heard.

    Early-access tracks stay hidden until their unlock date unless the user is
    on Gold — recommending a track the player would refuse to start would be a
    dead end.
    """
    queryset = (
        Song.objects.select_related("artist", "album")
        .exclude(id__in=played_song_ids)
        .exclude(artist=user)
        .annotate(play_count=Count("stream_events"))
    )
    if user.subscription_tier != "gold":
        # Mirrors RecordStreamView: a track is unlocked only once it has an
        # unlock date and that date has passed. A missing date means locked.
        still_locked = Q(is_early_access=True) & (
            Q(early_access_unlock_date__isnull=True)
            | Q(early_access_unlock_date__gt=timezone.now())
        )
        queryset = queryset.exclude(still_locked)
    return queryset


def _reason(song, genre_score, collab_score, artist_score, anchor, follows_artist) -> str:
    """Name the signal that contributed most to this song's score."""
    contributions = {
        "genre": W_GENRE * genre_score,
        "collab": W_COLLAB * collab_score,
        "artist": W_ARTIST * artist_score,
    }
    top = max(contributions, key=contributions.get)

    if contributions[top] == 0:
        return "Popular on Shpotify right now"
    if top == "genre":
        return f"Because you often listen to {song.genre}"
    if top == "collab" and anchor.get("title"):
        return f"Listeners who play {anchor['title']} also play this"
    if top == "collab":
        return "Listeners with similar taste play this"
    if follows_artist:
        return f"New to you from {song.artist.full_name or song.artist.username}, who you follow"
    return f"More from {song.artist.full_name or song.artist.username}"


def recommend_for_user(user, limit: int = 10) -> dict:
    """Rank the catalog for one user and return the top `limit` songs.

    The return value carries the score breakdown alongside each song so the
    reasoning is inspectable — both by the UI and by anyone auditing that the
    suggestions are not random.
    """
    played_song_ids = set(
        StreamEvent.objects.filter(user=user).values_list("song_id", flat=True)
    )

    genre_affinity = _genre_affinity(user)
    artist_affinity = _artist_affinity(user)
    collab_scores, anchor = _collaborative(user, played_song_ids)

    candidates = list(_visible_candidates(user, played_song_ids))
    popularity = _popularity(candidates)

    followed_ids = set(
        Follow.objects.filter(follower=user).values_list("following_id", flat=True)
    )

    scored = []
    for song in candidates:
        genre_score = genre_affinity.get(song.genre, 0.0) if song.genre else 0.0
        collab_score = collab_scores.get(song.id, 0.0)
        artist_score = artist_affinity.get(song.artist_id, 0.0)
        popularity_score = popularity.get(song.id, 0.0)

        score = (
            W_GENRE * genre_score
            + W_COLLAB * collab_score
            + W_ARTIST * artist_score
            + W_POPULARITY * popularity_score
        )
        if score < MIN_SCORE:
            continue

        scored.append(
            {
                "song": song,
                "score": score,
                "reason": _reason(
                    song,
                    genre_score,
                    collab_score,
                    artist_score,
                    anchor,
                    song.artist_id in followed_ids,
                ),
                "breakdown": {
                    "genreAffinity": round(genre_score, 4),
                    "collaborative": round(collab_score, 4),
                    "artistAffinity": round(artist_score, 4),
                    "popularity": round(popularity_score, 4),
                },
            }
        )

    # Sort by score, then by id so equal scores never reorder between requests.
    scored.sort(key=lambda item: (-item["score"], item["song"].id))

    return {
        "strategy": "hybrid" if played_song_ids else "cold-start",
        "basedOnPlays": len(played_song_ids),
        "weights": {
            "genreAffinity": W_GENRE,
            "collaborative": W_COLLAB,
            "artistAffinity": W_ARTIST,
            "popularity": W_POPULARITY,
        },
        "items": scored[:limit],
    }
