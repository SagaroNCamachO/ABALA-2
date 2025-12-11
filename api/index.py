"""
Punto de entrada para Vercel Serverless Functions.
"""

import sys
import os

# Agregar el directorio raíz al path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel espera una variable llamada 'handler' o 'application'
handler = app
application = app

