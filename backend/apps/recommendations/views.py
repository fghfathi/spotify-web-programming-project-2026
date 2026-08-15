"""Recommendation API (part 3.10)."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.serializers import SongSerializer

from .engine import recommend_for_user

MAX_LIMIT = 50


class RecommendationView(APIView):
    """GET /api/recommendations/?limit=10 — songs ranked for the current user.

    Each item is a full song payload (so the player can queue it directly)
    plus the `reason` and `matchScore` that justify its position.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 10))
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, MAX_LIMIT))

        result = recommend_for_user(request.user, limit=limit)
        ctx = {"request": request}

        return Response(
            {
                "strategy": result["strategy"],
                "basedOnPlays": result["basedOnPlays"],
                "weights": result["weights"],
                "count": len(result["items"]),
                "items": [
                    {
                        "song": SongSerializer(item["song"], context=ctx).data,
                        "reason": item["reason"],
                        "matchScore": round(item["score"], 4),
                        "breakdown": item["breakdown"],
                    }
                    for item in result["items"]
                ],
            }
        )
