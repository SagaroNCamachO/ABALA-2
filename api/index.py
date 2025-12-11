"""
Punto de entrada para Vercel Serverless Functions.
"""

import sys
import os

# Obtener el directorio raíz del proyecto
# En Vercel, __file__ apunta a /var/task/api/index.py
# El directorio raíz es /var/task
if os.path.exists('/var/task'):
    # Estamos en Vercel
    root_dir = '/var/task'
else:
    # Estamos en desarrollo local
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(current_dir)

# Agregar el directorio raíz al path
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    # Importar la aplicación Flask
    from app import app
    
    # Vercel busca 'handler' o 'application'
    handler = app
    application = app
    
except ImportError as e:
    # Si hay un error de importación, crear una app de error informativa
    from flask import Flask, jsonify
    
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def error_handler(path):
        import traceback
        return jsonify({
            "error": "Error al importar la aplicación",
            "message": str(e),
            "root_dir": root_dir,
            "sys_path": sys.path[:5],  # Primeros 5 elementos
            "files_in_root": os.listdir(root_dir) if os.path.exists(root_dir) else "No existe"
        }), 500
    
    handler = error_app
    application = error_app
    
except Exception as e:
    # Cualquier otro error
    from flask import Flask, jsonify
    
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def error_handler(path):
        import traceback
        return jsonify({
            "error": "Error inesperado",
            "message": str(e),
            "type": type(e).__name__
        }), 500
    
    handler = error_app
    application = error_app
