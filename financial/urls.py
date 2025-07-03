from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'clientes', views.ClienteViewSet)
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'contas', views.ContaBancariaViewSet)
router.register(r'transacoes', views.TransacaoViewSet)
router.register(r'orcamentos', views.OrcamentoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]