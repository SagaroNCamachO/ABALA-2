"""
Versión simple de prueba para diagnosticar problemas en Vercel.
Sin dependencias adicionales, solo Flask básico.
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        "message": "API de Prueba funcionando",
        "status": "ok",
        "version": "1.0.0",
        "test": "Si ves esto, Flask está funcionando en Vercel"
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "message": "API funcionando correctamente"
    })

# Exportar para Vercel
handler = app
application = app

