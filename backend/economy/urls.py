from django.urls import path

from .views import BalanceView, TransactionListView

app_name = "economy"

urlpatterns = [
    path("balance/", BalanceView.as_view(), name="balance"),
    path("transactions/", TransactionListView.as_view(), name="transactions"),
]
