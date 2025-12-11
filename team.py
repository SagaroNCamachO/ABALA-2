"""
Módulo para la clase Team (Equipo).

Representa un equipo de básquetbol con sus estadísticas básicas.
"""


class Team:
    """Representa un equipo de básquetbol en el campeonato."""

    def __init__(self, name: str, category: str):
        """
        Inicializa un equipo.

        Args:
            name: Nombre del equipo
            category: Categoría a la que pertenece (TC, Senior, Super Senior)
        """
        self.name = name
        self.category = category
        self.pj = 0  # Partidos jugados
        self.pg = 0  # Partidos ganados
        self.pp = 0  # Partidos perdidos
        self.pf = 0  # Puntos a favor
        self.pc = 0  # Puntos en contra
        self.points = 0  # Puntos totales en la tabla
        self.penalty_points = 0  # Puntos de multa/restricción

    def add_match_result(self, points_for: int, points_against: int, won: bool):
        """
        Actualiza las estadísticas del equipo después de un partido.

        Args:
            points_for: Puntos anotados por el equipo
            points_against: Puntos recibidos
            won: True si ganó el partido, False si perdió
        """
        self.pj += 1
        self.pf += points_for
        self.pc += points_against

        if won:
            self.pg += 1
        else:
            self.pp += 1

    def calculate_points(self, points_per_win: int, points_per_loss: int):
        """
        Calcula los puntos totales del equipo.

        Args:
            points_per_win: Puntos otorgados por victoria
            points_per_loss: Puntos otorgados por derrota
        """
        self.points = (self.pg * points_per_win) + (self.pp * points_per_loss) - self.penalty_points

    def add_penalty(self, points: int):
        """
        Agrega o resta puntos de multa/restricción.

        Args:
            points: Puntos a agregar (positivo) o restar (negativo)
        """
        self.penalty_points += points

    def get_difference(self) -> int:
        """
        Calcula la diferencia de puntos (PF - PC).

        Returns:
            Diferencia de puntos
        """
        return self.pf - self.pc

    def to_dict(self) -> dict:
        """
        Convierte el equipo a un diccionario.

        Returns:
            Diccionario con las estadísticas del equipo
        """
        return {
            "name": self.name,
            "category": self.category,
            "pj": self.pj,
            "pg": self.pg,
            "pp": self.pp,
            "pf": self.pf,
            "pc": self.pc,
            "difference": self.get_difference(),
            "points": self.points,
            "penalty_points": self.penalty_points
        }

    def __repr__(self) -> str:
        return f"Team(name='{self.name}', category='{self.category}', points={self.points})"

