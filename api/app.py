"""
API Flask para el Sistema de Gestión de Campeonatos de Básquetbol.
Copia del archivo app.py en el directorio api para Vercel.
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from flask import Flask, request, jsonify
from flask_cors import CORS
import json

# Importar módulos del proyecto
try:
    from championship import Championship
except ImportError:
    # Si no se puede importar desde el directorio padre, intentar importar directamente
    # Esto requiere que los módulos estén en el mismo directorio o en el path
    import importlib.util
    
    # Intentar cargar championship.py desde el directorio padre
    championship_path = os.path.join(parent_dir, 'championship.py')
    if os.path.exists(championship_path):
        spec = importlib.util.spec_from_file_location("championship", championship_path)
        championship_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(championship_module)
        Championship = championship_module.Championship
    else:
        raise ImportError("No se pudo encontrar championship.py")

app = Flask(__name__)
CORS(app)  # Permitir CORS para desarrollo

# Almacenar campeonatos en memoria (en producción usar base de datos)
championships = {}


@app.route('/')
def index():
    """Endpoint raíz con información de la API."""
    return jsonify({
        "message": "API de Gestión de Campeonatos de Básquetbol",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "POST /api/championships": "Crear un nuevo campeonato",
            "GET /api/championships": "Listar todos los campeonatos",
            "GET /api/championships/<id>": "Obtener un campeonato",
            "POST /api/championships/<id>/categories": "Agregar categoría",
            "POST /api/championships/<id>/results": "Registrar resultado",
            "GET /api/championships/<id>/standings/<category>": "Obtener tabla de posiciones",
            "GET /api/championships/<id>/fixture/<category>": "Obtener fixture",
            "POST /api/championships/<id>/penalty": "Aplicar multa"
        }
    })


@app.route('/api/championships', methods=['POST'])
def create_championship():
    """Crear un nuevo campeonato."""
    data = request.json
    
    champ_id = data.get('id', f"champ_{len(championships) + 1}")
    name = data.get('name', 'Campeonato')
    rounds = data.get('rounds', 1)
    points_per_win = data.get('points_per_win', 2)
    points_per_loss = data.get('points_per_loss', 0)
    
    championship = Championship(name, rounds, points_per_win, points_per_loss)
    championships[champ_id] = championship
    
    return jsonify({
        "success": True,
        "id": champ_id,
        "championship": championship.to_dict()
    }), 201


@app.route('/api/championships', methods=['GET'])
def list_championships():
    """Listar todos los campeonatos."""
    return jsonify({
        "success": True,
        "championships": {
            champ_id: {
                "id": champ_id,
                "name": champ.name,
                "rounds": champ.rounds,
                "categories": list(champ.categories.keys())
            }
            for champ_id, champ in championships.items()
        }
    })


@app.route('/api/championships/<champ_id>', methods=['GET'])
def get_championship(champ_id):
    """Obtener un campeonato específico."""
    if champ_id not in championships:
        return jsonify({"success": False, "error": "Campeonato no encontrado"}), 404
    
    return jsonify({
        "success": True,
        "championship": championships[champ_id].to_dict()
    })


@app.route('/api/championships/<champ_id>/categories', methods=['POST'])
def add_category(champ_id):
    """Agregar una categoría a un campeonato."""
    if champ_id not in championships:
        return jsonify({"success": False, "error": "Campeonato no encontrado"}), 404
    
    data = request.json
    category_name = data.get('name')
    team_names = data.get('teams', [])
    num_teams = data.get('num_teams')
    points_per_win = data.get('points_per_win')
    points_per_loss = data.get('points_per_loss')
    
    try:
        if team_names:
            championships[champ_id].add_category_with_teams(
                category_name, team_names, points_per_win, points_per_loss
            )
        elif num_teams:
            championships[champ_id].add_category(
                category_name, num_teams, points_per_win, points_per_loss
            )
        else:
            return jsonify({"success": False, "error": "Debe proporcionar 'teams' o 'num_teams'"}), 400
        
        return jsonify({
            "success": True,
            "category": championships[champ_id].get_category(category_name).to_dict()
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/championships/<champ_id>/results', methods=['POST'])
def register_result(champ_id):
    """Registrar el resultado de un partido."""
    if champ_id not in championships:
        return jsonify({"success": False, "error": "Campeonato no encontrado"}), 404
    
    data = request.json
    category_name = data.get('category')
    team_a = data.get('team_a')
    team_b = data.get('team_b')
    round_number = data.get('round_number')
    score_a = data.get('score_a')
    score_b = data.get('score_b')
    match_type = data.get('match_type')
    
    success = championships[champ_id].register_match_result(
        category_name, team_a, team_b, round_number, score_a, score_b, match_type
    )
    
    if success:
        return jsonify({"success": True, "message": "Resultado registrado"}), 200
    else:
        return jsonify({"success": False, "error": "No se pudo registrar el resultado"}), 400


@app.route('/api/championships/<champ_id>/standings/<category_name>', methods=['GET'])
def get_standings(champ_id, category_name):
    """Obtener la tabla de posiciones de una categoría."""
    if champ_id not in championships:
        return jsonify({"success": False, "error": "Campeonato no encontrado"}), 404
    
    standings = championships[champ_id].get_standings(category_name)
    
    if standings is None:
        return jsonify({"success": False, "error": "Categoría no encontrada"}), 404
    
    return jsonify({
        "success": True,
        "standings": [team.to_dict() for team in standings]
    })


@app.route('/api/championships/<champ_id>/fixture/<category_name>', methods=['GET'])
def get_fixture(champ_id, category_name):
    """Obtener el fixture de una categoría."""
    if champ_id not in championships:
        return jsonify({"success": False, "error": "Campeonato no encontrado"}), 404
    
    category = championships[champ_id].get_category(category_name)
    
    if category is None:
        return jsonify({"success": False, "error": "Categoría no encontrada"}), 404
    
    round_number = request.args.get('round', type=int)
    
    if round_number:
        matches = category.get_matches_by_round(round_number)
    else:
        matches = category.matches
    
    return jsonify({
        "success": True,
        "matches": [match.to_dict() for match in matches]
    })


@app.route('/api/championships/<champ_id>/penalty', methods=['POST'])
def apply_penalty(champ_id):
    """Aplicar una multa o bonificación de puntos."""
    if champ_id not in championships:
        return jsonify({"success": False, "error": "Campeonato no encontrado"}), 404
    
    data = request.json
    category_name = data.get('category')
    team_name = data.get('team')
    points = data.get('points')
    
    championships[champ_id].apply_penalty(category_name, team_name, points)
    
    return jsonify({"success": True, "message": "Multa aplicada"})

