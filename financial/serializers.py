from rest_framework import serializers
from .models import Cliente, Categoria, ContaBancaria, Transacao, Orcamento


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class ContaBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContaBancaria
        fields = '__all__'


class TransacaoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.ReadOnlyField(source='categoria.nome')
    conta_nome = serializers.ReadOnlyField(source='conta.nome')
    cliente_nome = serializers.ReadOnlyField(source='cliente.nome')
    
    class Meta:
        model = Transacao
        fields = '__all__'
        read_only_fields = ('criado_por', 'criado_em', 'atualizado_em')
    
    def create(self, validated_data):
        validated_data['criado_por'] = self.context['request'].user
        return super().create(validated_data)


class OrcamentoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.ReadOnlyField(source='categoria.nome')
    valor_realizado = serializers.DecimalField(read_only=True, max_digits=15, decimal_places=2)
    
    class Meta:
        model = Orcamento
        fields = ('id', 'ano', 'mes', 'categoria', 'categoria_nome', 'valor_planejado', 'valor_realizado')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['valor_realizado'] = instance.valor_realizado()
        return representation