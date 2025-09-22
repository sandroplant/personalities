from django.contrib import admin

from .models import CoinBalance, CoinTransaction, ReputationMetric


@admin.register(CoinBalance)
class CoinBalanceAdmin(admin.ModelAdmin):
    list_display = ("user", "coins", "updated_at")
    search_fields = ("user__username", "user__email")


@admin.register(CoinTransaction)
class CoinTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "event_type", "reason", "created_at")
    search_fields = ("user__username", "user__email", "reason", "reference_id")
    list_filter = ("event_type", "created_at")


@admin.register(ReputationMetric)
class ReputationMetricAdmin(admin.ModelAdmin):
    list_display = ("user", "score", "momentum", "last_recalculated")
    search_fields = ("user__username", "user__email")
