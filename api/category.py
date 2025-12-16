"""
Módulo para la clase Category (Categoría).

Gestiona una categoría del campeonato con sus equipos, partidos y tabla de posiciones.
"""

from typing import List, Dict
try:
    from api.team import Team
    from api.match import Match
    from api.standings import Standings
    from api.fixture_generator import FixtureGenerator
except ImportError:
    from team import Team
    from match import Match
    from standings import Standings
    from fixture_generator import FixtureGenerator


class Category:
    """Gestiona una categoría completa del campeonato."""

    def __init__(self, name: str, rounds: int, points_per_win: int = 2, points_per_loss: int = 0):
        """
        Inicializa una categoría.

        Args:
            name: Nombre de la categoría (TC, Senior, Super Senior)
            rounds: Número de vueltas del campeonato
            points_per_win: Puntos otorgados por victoria
            points_per_loss: Puntos otorgados por derrota
        """
        self.name = name
        self.rounds = rounds
        self.teams: Dict[str, Team] = {}
        self.matches: List[Match] = []
        self.standings = Standings(name, points_per_win, points_per_loss)
        self.fixture_generated = False

    def add_teams(self, team_names: List[str]):
        """
        Agrega equipos a la categoría.

        Args:
            team_names: Lista de nombres de equipos
        """
        for name in team_names:
            if name not in self.teams:
                team = Team(name, self.name)
                self.teams[name] = team
                self.standings.add_team(team)

    def generate_fixture(self):
        """Genera el fixture automáticamente basado en los equipos y vueltas."""
        if len(self.teams) < 2:
            raise ValueError("Se necesitan al menos 2 equipos para generar el fixture")

        team_names = list(self.teams.keys())
        self.matches = FixtureGenerator.generate_fixture(team_names, self.rounds)
        self.fixture_generated = True

    def register_match_result(self, team_a: str, team_b: str, round_number: int,
                             score_a: int, score_b: int, match_type: str = None) -> bool:
        """
        Registra el resultado de un partido.

        Args:
            team_a: Nombre del equipo A
            team_b: Nombre del equipo B
            round_number: Número de vuelta
            score_a: Puntos del equipo A
            score_b: Puntos del equipo B
            match_type: Tipo de partido ('ida' o 'vuelta'), opcional

        Returns:
            True si se registró correctamente, False si no se encontró el partido
        """
        # Buscar el partido (buscar en ambos sentidos: A vs B o B vs A)
        match = None
        for m in self.matches:
            # Verificar que los equipos coincidan (en cualquier orden)
            teams_match = ((m.team_a == team_a and m.team_b == team_b) or
                          (m.team_a == team_b and m.team_b == team_a))
            
            if teams_match and m.round_number == round_number:
                if match_type is None or m.match_type == match_type:
                    match = m
                    break

        if match is None:
            return False

        # Ajustar el orden de los puntajes según el orden del partido
        if match.team_a == team_a:
            # El orden coincide
            final_score_a = score_a
            final_score_b = score_b
        else:
            # El orden está invertido
            final_score_a = score_b
            final_score_b = score_a

        # Registrar resultado en el partido
        match.register_result(final_score_a, final_score_b)

        # Actualizar estadísticas de los equipos
        team_a_obj = self.teams[team_a]
        team_b_obj = self.teams[team_b]

        team_a_obj.add_match_result(score_a, score_b, score_a > score_b)
        team_b_obj.add_match_result(score_b, score_a, score_b > score_a)

        # Recalcular tabla de posiciones
        self.standings.update_standings()

        return True

    def apply_penalty(self, team_name: str, points: int):
        """
        Aplica una multa o bonificación de puntos a un equipo.

        Args:
            team_name: Nombre del equipo
            points: Puntos a agregar (positivo) o restar (negativo)
        """
        self.standings.apply_penalty(team_name, points)

    def get_standings(self) -> List[Team]:
        """
        Obtiene la tabla de posiciones ordenada.

        Returns:
            Lista de equipos ordenados
        """
        return self.standings.get_sorted_standings()

    def get_matches_by_round(self, round_number: int) -> List[Match]:
        """
        Obtiene los partidos de una vuelta específica.

        Args:
            round_number: Número de vuelta

        Returns:
            Lista de partidos de esa vuelta
        """
        return FixtureGenerator.get_matches_by_round(self.matches, round_number)

    def get_matches_by_team(self, team_name: str) -> List[Match]:
        """
        Obtiene los partidos de un equipo específico.

        Args:
            team_name: Nombre del equipo

        Returns:
            Lista de partidos del equipo
        """
        return FixtureGenerator.get_matches_by_team(self.matches, team_name)

    def to_dict(self) -> dict:
        """
        Convierte la categoría a un diccionario.

        Returns:
            Diccionario con toda la información de la categoría
        """
        return {
            "name": self.name,
            "rounds": self.rounds,
            "teams": [team.to_dict() for team in self.teams.values()],
            "matches": [match.to_dict() for match in self.matches],
            "standings": self.standings.to_dict()
        }

    def __repr__(self) -> str:
        return f"Category(name='{self.name}', teams={len(self.teams)}, rounds={self.rounds})"

