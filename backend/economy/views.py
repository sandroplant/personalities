"""API endpoints exposing coin balances and history."""

from __future__ import annotations

from rest_framework import generics, permissions
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CoinBalance, CoinTransaction
from .serializers import CoinBalanceSerializer, CoinTransactionSerializer


class BalanceView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        balance, _ = CoinBalance.objects.get_or_create(user=request.user)
        serializer = CoinBalanceSerializer(balance)
        return Response(serializer.data)


class TransactionListView(generics.ListAPIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CoinTransactionSerializer

    def get_queryset(self):
        return CoinTransaction.objects.filter(user=self.request.user).order_by("-created_at")
