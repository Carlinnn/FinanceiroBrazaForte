"""Utility functions for financial calculations."""
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta


def calcular_juros_simples(principal, taxa_juros, periodo):
    """
    Calcula juros simples.
    
    Args:
        principal (Decimal): Valor principal
        taxa_juros (Decimal): Taxa de juros (em percentual, ex: 2.5 para 2.5%)
        periodo (int): Período em meses
        
    Returns:
        Decimal: Valor dos juros
    """
    taxa_decimal = taxa_juros / Decimal('100')
    juros = principal * taxa_decimal * Decimal(str(periodo))
    return juros.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calcular_juros_compostos(principal, taxa_juros, periodo):
    """
    Calcula juros compostos.
    
    Args:
        principal (Decimal): Valor principal
        taxa_juros (Decimal): Taxa de juros (em percentual, ex: 2.5 para 2.5%)
        periodo (int): Período em meses
        
    Returns:
        Decimal: Valor total (principal + juros)
    """
    taxa_decimal = taxa_juros / Decimal('100')
    montante = principal * (Decimal('1') + taxa_decimal) ** Decimal(str(periodo))
    return montante.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calcular_prestacoes(valor_total, taxa_juros, num_parcelas):
    """
    Calcula o valor das prestações para um financiamento usando o sistema de amortização francês.
    
    Args:
        valor_total (Decimal): Valor total do financiamento
        taxa_juros (Decimal): Taxa de juros mensal (em percentual, ex: 2.5 para 2.5%)
        num_parcelas (int): Número de parcelas
        
    Returns:
        Decimal: Valor da prestação mensal
    """
    taxa_decimal = taxa_juros / Decimal('100')
    
    if taxa_decimal == Decimal('0'):
        return valor_total / Decimal(str(num_parcelas))
    
    fator = (Decimal('1') - (Decimal('1') + taxa_decimal) ** Decimal(str(-num_parcelas))) / taxa_decimal
    prestacao = valor_total / fator
    
    return prestacao.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calcular_dias_atraso(data_vencimento, data_pagamento=None):
    """
    Calcula os dias de atraso entre a data de vencimento e a data de pagamento.
    Se a data de pagamento não for fornecida, usa a data atual.
    
    Args:
        data_vencimento (date): Data de vencimento
        data_pagamento (date, optional): Data de pagamento. Default é a data atual.
        
    Returns:
        int: Número de dias de atraso (0 se não houver atraso)
    """
    if data_pagamento is None:
        data_pagamento = date.today()
        
    if data_pagamento <= data_vencimento:
        return 0
        
    return (data_pagamento - data_vencimento).days


def calcular_multa_atraso(valor, dias_atraso, percentual_multa=2, percentual_juros_diario=0.033):
    """
    Calcula o valor da multa e juros por atraso.
    
    Args:
        valor (Decimal): Valor original
        dias_atraso (int): Número de dias de atraso
        percentual_multa (Decimal, optional): Percentual de multa. Default é 2%.
        percentual_juros_diario (Decimal, optional): Percentual de juros diário. Default é 0.033% (1% ao mês).
        
    Returns:
        tuple: (valor_multa, valor_juros, valor_total)
    """
    if dias_atraso <= 0:
        return Decimal('0'), Decimal('0'), valor
    
    # Multa fixa
    multa = valor * (Decimal(str(percentual_multa)) / Decimal('100'))
    
    # Juros diários
    juros = valor * (Decimal(str(percentual_juros_diario)) / Decimal('100') * Decimal(str(dias_atraso)))
    
    # Valores arredondados
    multa = multa.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    juros = juros.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    valor_total = valor + multa + juros
    
    return multa, juros, valor_total


def calcular_projecao_financeira(saldo_inicial, receitas_previstas, despesas_previstas, num_meses=12):
    """
    Calcula a projeção financeira para os próximos meses.
    
    Args:
        saldo_inicial (Decimal): Saldo inicial
        receitas_previstas (list): Lista de dicionários com receitas previstas mensais
                                  [{'valor': Decimal, 'mes': int, 'ano': int}, ...]
        despesas_previstas (list): Lista de dicionários com despesas previstas mensais
                                  [{'valor': Decimal, 'mes': int, 'ano': int}, ...]
        num_meses (int, optional): Número de meses para projeção. Default é 12.
        
    Returns:
        list: Lista de dicionários com a projeção mensal
              [{'mes': int, 'ano': int, 'receitas': Decimal, 'despesas': Decimal, 
                'saldo_mensal': Decimal, 'saldo_acumulado': Decimal}, ...]
    """
    hoje = date.today()
    projecao = []
    saldo_acumulado = saldo_inicial
    
    for i in range(num_meses):
        data_mes = hoje + relativedelta(months=i)
        mes = data_mes.month
        ano = data_mes.year
        
        # Filtrar receitas e despesas para o mês atual
        receitas_mes = sum(r['valor'] for r in receitas_previstas if r.get('mes') == mes and r.get('ano') == ano)
        despesas_mes = sum(d['valor'] for d in despesas_previstas if d.get('mes') == mes and d.get('ano') == ano)
        
        saldo_mensal = receitas_mes - despesas_mes
        saldo_acumulado += saldo_mensal
        
        projecao.append({
            'mes': mes,
            'ano': ano,
            'receitas': receitas_mes,
            'despesas': despesas_mes,
            'saldo_mensal': saldo_mensal,
            'saldo_acumulado': saldo_acumulado
        })
    
    return projecao