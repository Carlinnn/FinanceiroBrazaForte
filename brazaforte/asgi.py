"""
ASGI config for BrazaForte Financial System.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'brazaforte.settings')

application = get_asgi_application()