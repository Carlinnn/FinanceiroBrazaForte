from django.contrib import admin
from .models import Cliente, Categoria, ContaBancaria, Transacao, Orcamento


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo', 'documento', 'email', 'telefone', 'ativo')
    list_filter = ('tipo', 'ativo', 'data_cadastro')
    search_fields = ('nome', 'documento', 'email')
    date_hierarchy = 'data_cadastro'


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo', 'descricao')
    list_filter = ('tipo',)
    search_fields = ('nome',)


@admin.register(ContaBancaria)
class ContaBancariaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'banco', 'agencia', 'conta', 'saldo_atual', 'ativa')
    list_filter = ('banco', 'ativa')
    search_fields = ('nome', 'banco')


class TransacaoAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'tipo', 'valor', 'data_transacao', 'status', 'categoria', 'conta')
    list_filter = ('tipo', 'status', 'data_transacao', 'categoria')
    search_fields = ('descricao',)
    date_hierarchy = 'data_transacao'
    readonly_fields = ('criado_em', 'atualizado_em')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Se é uma nova transação
            obj.criado_por = request.user
        super().save_model(request, obj, form, change)

admin.site.register(Transacao, TransacaoAdmin)


@admin.register(Orcamento)
class OrcamentoAdmin(admin.ModelAdmin):
    list_display = ('categoria', 'mes', 'ano', 'valor_planejado', 'valor_realizado')
    list_filter = ('ano', 'mes', 'categoria__tipo')
    
    def valor_realizado(self, obj):
        return obj.valor_realizado()
    valor_realizado.short_description = 'Valor Realizado'