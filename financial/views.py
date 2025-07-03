from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Cliente, Categoria, ContaBancaria, Transacao, Orcamento
from .serializers import (
    ClienteSerializer, CategoriaSerializer, ContaBancariaSerializer,
    TransacaoSerializer, OrcamentoSerializer
)


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'ativo']
    search_fields = ['nome', 'documento', 'email']
    ordering_fields = ['nome', 'data_cadastro']


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo']
    search_fields = ['nome']


class ContaBancariaViewSet(viewsets.ModelViewSet):
    queryset = ContaBancaria.objects.all()
    serializer_class = ContaBancariaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativa']
    search_fields = ['nome', 'banco']
    ordering_fields = ['nome', 'saldo_atual']


class TransacaoViewSet(viewsets.ModelViewSet):
    queryset = Transacao.objects.all()
    serializer_class = TransacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'status', 'categoria', 'conta', 'cliente']
    search_fields = ['descricao']
    ordering_fields = ['data_transacao', 'valor', 'data_vencimento']
    
    @action(detail=False, methods=['get'])
    def resumo_mensal(self, request):
        """Retorna resumo financeiro do mês atual."""
        hoje = timezone.now().date()
        primeiro_dia = hoje.replace(day=1)
        if hoje.month == 12:
            proximo_mes = hoje.replace(year=hoje.year + 1, month=1, day=1)
        else:
            proximo_mes = hoje.replace(month=hoje.month + 1, day=1)
        
        # Filtrar transações do mês atual
        transacoes = Transacao.objects.filter(
            data_transacao__gte=primeiro_dia,
            data_transacao__lt=proximo_mes,
            status=Transacao.STATUS_CONFIRMADO
        )
        
        # Calcular totais
        receitas = transacoes.filter(tipo=Transacao.TIPO_RECEITA).aggregate(total=Sum('valor'))
        despesas = transacoes.filter(tipo=Transacao.TIPO_DESPESA).aggregate(total=Sum('valor'))
        
        # Resumo por categoria
        categorias = transacoes.values('categoria__nome', 'categoria__tipo').annotate(
            total=Sum('valor'),
            count=Count('id')
        ).order_by('-total')
        
        # Contas a pagar e receber
        a_pagar = Transacao.objects.filter(
            tipo=Transacao.TIPO_DESPESA,
            status=Transacao.STATUS_PENDENTE,
            data_vencimento__gte=hoje
        ).aggregate(total=Sum('valor'), count=Count('id'))
        
        a_receber = Transacao.objects.filter(
            tipo=Transacao.TIPO_RECEITA,
            status=Transacao.STATUS_PENDENTE,
            data_vencimento__gte=hoje
        ).aggregate(total=Sum('valor'), count=Count('id'))
        
        return Response({
            'periodo': {
                'inicio': primeiro_dia,
                'fim': proximo_mes - timezone.timedelta(days=1),
            },
            'receitas': receitas['total'] or 0,
            'despesas': despesas['total'] or 0,
            'saldo': (receitas['total'] or 0) - (despesas['total'] or 0),
            'categorias': categorias,
            'contas_a_pagar': {
                'total': a_pagar['total'] or 0,
                'quantidade': a_pagar['count'] or 0
            },
            'contas_a_receber': {
                'total': a_receber['total'] or 0,
                'quantidade': a_receber['count'] or 0
            }
        })


class OrcamentoViewSet(viewsets.ModelViewSet):
    queryset = Orcamento.objects.all()
    serializer_class = OrcamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ano', 'mes', 'categoria']
    ordering_fields = ['ano', 'mes', 'valor_planejado']
    
    @action(detail=False, methods=['get'])
    def comparativo(self, request):
        """Retorna comparativo entre orçado e realizado."""
        ano = request.query_params.get('ano', timezone.now().year)
        mes = request.query_params.get('mes', timezone.now().month)
        
        orcamentos = Orcamento.objects.filter(ano=ano, mes=mes)
        
        resultado = []
        for orcamento in orcamentos:
            resultado.append({
                'categoria': orcamento.categoria.nome,
                'tipo': orcamento.categoria.get_tipo_display(),
                'valor_planejado': orcamento.valor_planejado,
                'valor_realizado': orcamento.valor_realizado(),
                'diferenca': orcamento.valor_realizado() - orcamento.valor_planejado
            })
        
        return Response(resultado)