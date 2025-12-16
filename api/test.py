"""
Archivo de prueba simple para verificar que Vercel funciona.
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        "message": "API funcionando correctamente",
        "status": "ok",
        "test": True
    })

@app.route('/test')
def test():
    return jsonify({"test": "success"})

# Exportar para Vercel
handler = app
application = app

