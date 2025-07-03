from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Cliente(models.Model):
    """Modelo para representar clientes da empresa."""
    PESSOA_FISICA = 'PF'
    PESSOA_JURIDICA = 'PJ'
    TIPO_CLIENTE = [
        (PESSOA_FISICA, 'Pessoa Física'),
        (PESSOA_JURIDICA, 'Pessoa Jurídica'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo = models.CharField(max_length=2, choices=TIPO_CLIENTE, default=PESSOA_FISICA)
    nome = models.CharField(max_length=255)
    documento = models.CharField(max_length=20, unique=True, help_text="CPF/CNPJ")
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20)
    endereco = models.TextField()
    data_cadastro = models.DateTimeField(auto_now_add=True)
    ativo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"
    
    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['nome']


class Categoria(models.Model):
    """Modelo para categorizar transações financeiras."""
    TIPO_RECEITA = 'R'
    TIPO_DESPESA = 'D'
    TIPO_ESCOLHAS = [
        (TIPO_RECEITA, 'Receita'),
        (TIPO_DESPESA, 'Despesa'),
    ]
    
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=1, choices=TIPO_ESCOLHAS)
    descricao = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"
    
    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        ordering = ['tipo', 'nome']


class ContaBancaria(models.Model):
    """Modelo para representar contas bancárias da empresa."""
    nome = models.CharField(max_length=100)
    banco = models.CharField(max_length=100)
    agencia = models.CharField(max_length=20)
    conta = models.CharField(max_length=20)
    saldo_atual = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    data_abertura = models.DateField()
    ativa = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nome} - {self.banco} ({self.agencia}/{self.conta})"
    
    class Meta:
        verbose_name = "Conta Bancária"
        verbose_name_plural = "Contas Bancárias"
        ordering = ['nome']


class Transacao(models.Model):
    """Modelo para transações financeiras."""
    TIPO_RECEITA = 'R'
    TIPO_DESPESA = 'D'
    TIPO_TRANSFERENCIA = 'T'
    TIPO_ESCOLHAS = [
        (TIPO_RECEITA, 'Receita'),
        (TIPO_DESPESA, 'Despesa'),
        (TIPO_TRANSFERENCIA, 'Transferência'),
    ]
    
    STATUS_PENDENTE = 'P'
    STATUS_CONFIRMADO = 'C'
    STATUS_CANCELADO = 'X'
    STATUS_ESCOLHAS = [
        (STATUS_PENDENTE, 'Pendente'),
        (STATUS_CONFIRMADO, 'Confirmado'),
        (STATUS_CANCELADO, 'Cancelado'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo = models.CharField(max_length=1, choices=TIPO_ESCOLHAS)
    descricao = models.CharField(max_length=255)
    valor = models.DecimalField(max_digits=15, decimal_places=2)
    data_transacao = models.DateField()
    data_vencimento = models.DateField(null=True, blank=True)
    data_pagamento = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=1, choices=STATUS_ESCOLHAS, default=STATUS_PENDENTE)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, null=True, blank=True)
    conta = models.ForeignKey(ContaBancaria, on_delete=models.PROTECT, related_name='transacoes')
    conta_destino = models.ForeignKey(ContaBancaria, on_delete=models.PROTECT, null=True, blank=True, related_name='transferencias_recebidas')
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, null=True, blank=True)
    comprovante = models.FileField(upload_to='comprovantes/', null=True, blank=True)
    observacoes = models.TextField(blank=True, null=True)
    criado_por = models.ForeignKey(User, on_delete=models.PROTECT)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.descricao} - R$ {self.valor}"
    
    class Meta:
        verbose_name = "Transação"
        verbose_name_plural = "Transações"
        ordering = ['-data_transacao']


class Orcamento(models.Model):
    """Modelo para orçamentos financeiros."""
    ano = models.PositiveSmallIntegerField()
    mes = models.PositiveSmallIntegerField()
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    valor_planejado = models.DecimalField(max_digits=15, decimal_places=2)
    
    def __str__(self):
        return f"{self.categoria.nome} - {self.mes}/{self.ano} - R$ {self.valor_planejado}"
    
    class Meta:
        verbose_name = "Orçamento"
        verbose_name_plural = "Orçamentos"
        ordering = ['ano', 'mes', 'categoria']
        unique_together = ['ano', 'mes', 'categoria']
        
    def valor_realizado(self):
        """Calcula o valor realizado para esta categoria no período."""
        inicio_mes = timezone.datetime(self.ano, self.mes, 1).date()
        if self.mes == 12:
            fim_mes = timezone.datetime(self.ano + 1, 1, 1).date()
        else:
            fim_mes = timezone.datetime(self.ano, self.mes + 1, 1).date()
            
        transacoes = Transacao.objects.filter(
            categoria=self.categoria,
            data_transacao__gte=inicio_mes,
            data_transacao__lt=fim_mes,
            status=Transacao.STATUS_CONFIRMADO
        )
        
        return transacoes.aggregate(models.Sum('valor'))['valor__sum'] or 0