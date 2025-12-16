"""
Punto de entrada para Vercel Serverless Functions.
Vercel maneja Flask automáticamente cuando se exporta la app directamente.
"""

import sys
import os

# Configurar paths
if os.path.exists('/var/task'):
    base_path = '/var/task'
else:
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if base_path not in sys.path:
    sys.path.insert(0, base_path)

# Importar la aplicación Flask
try:
    from api.app import app
except ImportError:
    try:
        from app import app
    except ImportError:
        from flask import Flask, jsonify
        app = Flask(__name__)
        
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def error(path):
            return jsonify({
                "error": "No se pudo importar la aplicación Flask"
            }), 500

# Vercel busca 'handler' o 'application'
# Para Flask, simplemente exportamos la app - Vercel la maneja automáticamente
handler = app
application = app
