"""
WSGI config for BrazaForte Financial System.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'brazaforte.settings')

application = get_wsgi_application()