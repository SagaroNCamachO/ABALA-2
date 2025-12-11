"""
Módulo para la clase Standings (Tabla de Posiciones).

Gestiona la tabla de posiciones de una categoría.
"""

from typing import List, Dict
from team import Team


class Standings:
    """Gestiona la tabla de posiciones de una categoría."""

    def __init__(self, category: str, points_per_win: int = 2, points_per_loss: int = 0):
        """
        Inicializa la tabla de posiciones.

        Args:
            category: Nombre de la categoría
            points_per_win: Puntos otorgados por victoria
            points_per_loss: Puntos otorgados por derrota
        """
        self.category = category
        self.points_per_win = points_per_win
        self.points_per_loss = points_per_loss
        self.teams: Dict[str, Team] = {}

    def add_team(self, team: Team):
        """
        Agrega un equipo a la tabla de posiciones.

        Args:
            team: Instancia de Team
        """
        self.teams[team.name] = team

    def update_standings(self):
        """Recalcula todas las posiciones de la tabla."""
        for team in self.teams.values():
            team.calculate_points(self.points_per_win, self.points_per_loss)

    def get_sorted_standings(self) -> List[Team]:
        """
        Obtiene la tabla de posiciones ordenada.

        Ordena por:
        1. Puntos totales (descendente)
        2. Diferencia de puntos (descendente)
        3. Puntos a favor (descendente)
        4. Nombre (alfabético)

        Returns:
            Lista de equipos ordenados
        """
        self.update_standings()
        sorted_teams = sorted(
            self.teams.values(),
            key=lambda t: (-t.points, -t.get_difference(), -t.pf, t.name)
        )
        return sorted_teams

    def get_team(self, team_name: str) -> Team:
        """
        Obtiene un equipo por su nombre.

        Args:
            team_name: Nombre del equipo

        Returns:
            Instancia de Team
        """
        return self.teams.get(team_name)

    def apply_penalty(self, team_name: str, points: int):
        """
        Aplica una multa o bonificación de puntos a un equipo.

        Args:
            team_name: Nombre del equipo
            points: Puntos a agregar (positivo) o restar (negativo)
        """
        if team_name in self.teams:
            self.teams[team_name].add_penalty(points)
            self.update_standings()

    def to_dict(self) -> dict:
        """
        Convierte la tabla de posiciones a un diccionario.

        Returns:
            Diccionario con la tabla de posiciones
        """
        sorted_teams = self.get_sorted_standings()
        return {
            "category": self.category,
            "points_per_win": self.points_per_win,
            "points_per_loss": self.points_per_loss,
            "standings": [team.to_dict() for team in sorted_teams]
        }

    def __repr__(self) -> str:
        return f"Standings(category='{self.category}', teams={len(self.teams)})"

