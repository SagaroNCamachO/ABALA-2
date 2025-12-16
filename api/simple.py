"""
Versión simple de prueba para diagnosticar problemas en Vercel.
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        "message": "API de Prueba funcionando",
        "status": "ok",
        "version": "1.0.0"
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

# Exportar para Vercel
handler = app
application = app

