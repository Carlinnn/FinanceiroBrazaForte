from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Transacao


@receiver(post_save, sender=Transacao)
def atualizar_saldo_conta(sender, instance, created, **kwargs):
    """
    Atualiza o saldo da conta bancária quando uma transação é criada ou modificada.
    """
    if instance.status == Transacao.STATUS_CONFIRMADO:
        conta = instance.conta
        
        # Para novas transações confirmadas
        if created:
            if instance.tipo == Transacao.TIPO_RECEITA:
                conta.saldo_atual += instance.valor
            elif instance.tipo == Transacao.TIPO_DESPESA:
                conta.saldo_atual -= instance.valor
            elif instance.tipo == Transacao.TIPO_TRANSFERENCIA and instance.conta_destino:
                # Debita da conta de origem
                conta.saldo_atual -= instance.valor
                # Credita na conta de destino
                conta_destino = instance.conta_destino
                conta_destino.saldo_atual += instance.valor
                conta_destino.save()
                
            conta.save()
        else:
            # A transação foi atualizada, necessário recalcular o saldo
            from django.db import connection
            with connection.cursor() as cursor:
                # Resetar o saldo de todas as contas
                cursor.execute("""
                    UPDATE financial_contabancaria
                    SET saldo_atual = 0
                    WHERE id > 0
                """)
                
                # Recalcular o saldo com base em todas as transações confirmadas
                cursor.execute("""
                    UPDATE financial_contabancaria
                    SET saldo_atual = (
                        SELECT COALESCE(SUM(
                            CASE 
                                WHEN t.tipo = 'R' THEN t.valor
                                WHEN t.tipo = 'D' THEN -t.valor
                                ELSE 0
                            END
                        ), 0)
                        FROM financial_transacao t
                        WHERE t.conta_id = financial_contabancaria.id
                        AND t.status = 'C'
                    )
                    WHERE id > 0
                """)
                
                # Processar transferências
                cursor.execute("""
                    UPDATE financial_contabancaria
                    SET saldo_atual = saldo_atual - (
                        SELECT COALESCE(SUM(t.valor), 0)
                        FROM financial_transacao t
                        WHERE t.conta_id = financial_contabancaria.id
                        AND t.tipo = 'T'
                        AND t.status = 'C'
                    )
                    WHERE id > 0
                """)
                
                cursor.execute("""
                    UPDATE financial_contabancaria
                    SET saldo_atual = saldo_atual + (
                        SELECT COALESCE(SUM(t.valor), 0)
                        FROM financial_transacao t
                        WHERE t.conta_destino_id = financial_contabancaria.id
                        AND t.tipo = 'T'
                        AND t.status = 'C'
                    )
                    WHERE id > 0
                """)


@receiver(post_delete, sender=Transacao)
def recalcular_saldo_apos_exclusao(sender, instance, **kwargs):
    """
    Recalcula o saldo da conta quando uma transação é excluída.
    """
    if instance.status == Transacao.STATUS_CONFIRMADO:
        from django.db import connection
        with connection.cursor() as cursor:
            # Resetar o saldo de todas as contas
            cursor.execute("""
                UPDATE financial_contabancaria
                SET saldo_atual = 0
                WHERE id > 0
            """)
            
            # Recalcular o saldo com base em todas as transações confirmadas
            cursor.execute("""
                UPDATE financial_contabancaria
                SET saldo_atual = (
                    SELECT COALESCE(SUM(
                        CASE 
                            WHEN t.tipo = 'R' THEN t.valor
                            WHEN t.tipo = 'D' THEN -t.valor
                            ELSE 0
                        END
                    ), 0)
                    FROM financial_transacao t
                    WHERE t.conta_id = financial_contabancaria.id
                    AND t.status = 'C'
                )
                WHERE id > 0
            """)
            
            # Processar transferências
            cursor.execute("""
                UPDATE financial_contabancaria
                SET saldo_atual = saldo_atual - (
                    SELECT COALESCE(SUM(t.valor), 0)
                    FROM financial_transacao t
                    WHERE t.conta_id = financial_contabancaria.id
                    AND t.tipo = 'T'
                    AND t.status = 'C'
                )
                WHERE id > 0
            """)
            
            cursor.execute("""
                UPDATE financial_contabancaria
                SET saldo_atual = saldo_atual + (
                    SELECT COALESCE(SUM(t.valor), 0)
                    FROM financial_transacao t
                    WHERE t.conta_destino_id = financial_contabancaria.id
                    AND t.tipo = 'T'
                    AND t.status = 'C'
                )
                WHERE id > 0
            """)