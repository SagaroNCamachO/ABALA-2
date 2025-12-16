"""
Punto de entrada para Vercel Serverless Functions.
Versión simplificada y robusta.
"""

import sys
import os

# Configurar paths - Vercel usa /var/task como raíz
if os.path.exists('/var/task'):
    base_path = '/var/task'
else:
    # Desarrollo local
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Agregar al path de Python
if base_path not in sys.path:
    sys.path.insert(0, base_path)

# Intentar importar con manejo de errores detallado
try:
    # Primero verificar que Flask esté disponible
    import flask
    print(f"Flask version: {flask.__version__}")
    
    # Intentar importar desde api/app.py primero (más cercano)
    try:
        from api.app import app
        print("App importada desde api/app.py")
    except ImportError:
        # Si falla, intentar desde el directorio padre
        from app import app
        print("App importada desde app.py (directorio padre)")
    
    # Exportar para Vercel
    handler = app
    application = app
    
except ImportError as import_error:
    # Error de importación - crear app de diagnóstico
    print(f"ImportError: {import_error}")
    
    try:
        from flask import Flask, jsonify
    except ImportError:
        # Flask no está instalado
        def handler(event, context):
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': '{"error": "Flask no está instalado. Verifica requirements.txt"}'
            }
        application = None
    else:
        # Flask está instalado pero hay otro error de importación
        error_app = Flask(__name__)
        
        @error_app.route('/', defaults={'path': ''})
        @error_app.route('/<path:path>')
        def diagnostic(path):
            import traceback
            files_in_base = []
            try:
                files_in_base = os.listdir(base_path)
            except:
                pass
            
            return jsonify({
                "error": "Error de importación",
                "import_error": str(import_error),
                "base_path": base_path,
                "base_path_exists": os.path.exists(base_path),
                "sys_path": sys.path[:10],
                "files_in_base": files_in_base[:20],
                "traceback": traceback.format_exc()
            }), 500
        
        handler = error_app
        application = error_app
        
except Exception as e:
    # Cualquier otro error
    print(f"Error inesperado: {e}")
    import traceback
    traceback.print_exc()
    
    try:
        from flask import Flask, jsonify
        error_app = Flask(__name__)
        
        @error_app.route('/', defaults={'path': ''})
        @error_app.route('/<path:path>')
        def error_handler(path):
            return jsonify({
                "error": "Error inesperado",
                "message": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc()
            }), 500
        
        handler = error_app
        application = error_app
    except:
        def handler(event, context):
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': f'{{"error": "Error crítico: {str(e)}"}}'
            }
        application = None
