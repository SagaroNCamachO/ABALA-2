"""
Módulo para la clase Match (Partido).

Representa un partido entre dos equipos con su resultado.
"""


class Match:
    """Representa un partido entre dos equipos."""

    def __init__(self, team_a: str, team_b: str, round_number: int, match_type: str = "ida"):
        """
        Inicializa un partido.

        Args:
            team_a: Nombre del equipo local
            team_b: Nombre del equipo visitante
            round_number: Número de vuelta/fecha
            match_type: Tipo de partido ('ida' o 'vuelta')
        """
        self.team_a = team_a
        self.team_b = team_b
        self.round_number = round_number
        self.match_type = match_type
        self.played = False
        self.score_a = None
        self.score_b = None
        self.winner = None

    def register_result(self, score_a: int, score_b: int):
        """
        Registra el resultado del partido.

        Args:
            score_a: Puntos del equipo A
            score_b: Puntos del equipo B
        """
        self.score_a = score_a
        self.score_b = score_b
        self.played = True

        if score_a > score_b:
            self.winner = self.team_a
        elif score_b > score_a:
            self.winner = self.team_b
        else:
            self.winner = "Empate"

    def to_dict(self) -> dict:
        """
        Convierte el partido a un diccionario.

        Returns:
            Diccionario con la información del partido
        """
        return {
            "team_a": self.team_a,
            "team_b": self.team_b,
            "round_number": self.round_number,
            "match_type": self.match_type,
            "played": self.played,
            "score_a": self.score_a,
            "score_b": self.score_b,
            "winner": self.winner
        }

    def __repr__(self) -> str:
        if self.played:
            return f"Match({self.team_a} {self.score_a} - {self.score_b} {self.team_b})"
        return f"Match({self.team_a} vs {self.team_b}, Round {self.round_number}, {self.match_type})"

