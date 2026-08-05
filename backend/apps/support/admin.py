from django.contrib import admin

from .models import ArtistPayout, SupportTicket, TicketReply


class TicketReplyInline(admin.TabularInline):
    model = TicketReply
    extra = 0


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("subject", "submitted_by", "status", "created_at")
    list_filter = ("status",)
    inlines = [TicketReplyInline]


@admin.register(ArtistPayout)
class ArtistPayoutAdmin(admin.ModelAdmin):
    list_display = ("artist", "period", "total_streams", "reward_amount", "status")
    list_filter = ("status", "period")
