"""
Módulo para la clase Championship (Campeonato).

Gestiona el campeonato completo con todas sus categorías.
"""

from typing import Dict, List, Optional
from category import Category


class Championship:
    """Gestiona un campeonato completo de básquetbol."""

    def __init__(self, name: str = "Campeonato de Básquetbol", rounds: int = 1,
                 points_per_win: int = 2, points_per_loss: int = 0):
        """
        Inicializa un campeonato.

        Args:
            name: Nombre del campeonato
            rounds: Número de vueltas del campeonato
            points_per_win: Puntos otorgados por victoria (por defecto)
            points_per_loss: Puntos otorgados por derrota (por defecto)
        """
        self.name = name
        self.rounds = rounds
        self.points_per_win = points_per_win
        self.points_per_loss = points_per_loss
        self.categories: Dict[str, Category] = {}

    def add_category(self, category_name: str, num_teams: int,
                     points_per_win: Optional[int] = None,
                     points_per_loss: Optional[int] = None):
        """
        Agrega una categoría al campeonato.

        Args:
            category_name: Nombre de la categoría (TC, Senior, Super Senior)
            num_teams: Número de equipos en la categoría
            points_per_win: Puntos por victoria (usa el valor por defecto si es None)
            points_per_loss: Puntos por derrota (usa el valor por defecto si es None)
        """
        if category_name in self.categories:
            raise ValueError(f"La categoría '{category_name}' ya existe")

        points_win = points_per_win if points_per_win is not None else self.points_per_win
        points_loss = points_per_loss if points_per_loss is not None else self.points_per_loss

        category = Category(category_name, self.rounds, points_win, points_loss)

        # Generar nombres de equipos automáticamente
        team_names = [f"{category_name} Equipo {i+1}" for i in range(num_teams)]
        category.add_teams(team_names)

        # Generar fixture automáticamente
        category.generate_fixture()

        self.categories[category_name] = category

    def add_category_with_teams(self, category_name: str, team_names: List[str],
                                points_per_win: Optional[int] = None,
                                points_per_loss: Optional[int] = None):
        """
        Agrega una categoría con nombres de equipos específicos.

        Args:
            category_name: Nombre de la categoría
            team_names: Lista de nombres de equipos
            points_per_win: Puntos por victoria (usa el valor por defecto si es None)
            points_per_loss: Puntos por derrota (usa el valor por defecto si es None)
        """
        if category_name in self.categories:
            raise ValueError(f"La categoría '{category_name}' ya existe")

        points_win = points_per_win if points_per_win is not None else self.points_per_win
        points_loss = points_per_loss if points_per_loss is not None else self.points_per_loss

        category = Category(category_name, self.rounds, points_win, points_loss)
        category.add_teams(team_names)
        category.generate_fixture()

        self.categories[category_name] = category

    def get_category(self, category_name: str) -> Optional[Category]:
        """
        Obtiene una categoría por su nombre.

        Args:
            category_name: Nombre de la categoría

        Returns:
            Instancia de Category o None si no existe
        """
        return self.categories.get(category_name)

    def register_match_result(self, category_name: str, team_a: str, team_b: str,
                             round_number: int, score_a: int, score_b: int,
                             match_type: str = None) -> bool:
        """
        Registra el resultado de un partido.

        Args:
            category_name: Nombre de la categoría
            team_a: Nombre del equipo A
            team_b: Nombre del equipo B
            round_number: Número de vuelta
            score_a: Puntos del equipo A
            score_b: Puntos del equipo B
            match_type: Tipo de partido ('ida' o 'vuelta'), opcional

        Returns:
            True si se registró correctamente, False en caso contrario
        """
        category = self.get_category(category_name)
        if category is None:
            return False

        return category.register_match_result(team_a, team_b, round_number, score_a, score_b, match_type)

    def apply_penalty(self, category_name: str, team_name: str, points: int):
        """
        Aplica una multa o bonificación de puntos a un equipo.

        Args:
            category_name: Nombre de la categoría
            team_name: Nombre del equipo
            points: Puntos a agregar (positivo) o restar (negativo)
        """
        category = self.get_category(category_name)
        if category:
            category.apply_penalty(team_name, points)

    def get_standings(self, category_name: str) -> Optional[List]:
        """
        Obtiene la tabla de posiciones de una categoría.

        Args:
            category_name: Nombre de la categoría

        Returns:
            Lista de equipos ordenados o None si la categoría no existe
        """
        category = self.get_category(category_name)
        if category is None:
            return None

        return category.get_standings()

    def to_dict(self) -> dict:
        """
        Convierte el campeonato completo a un diccionario.

        Returns:
            Diccionario con toda la información del campeonato
        """
        return {
            "name": self.name,
            "rounds": self.rounds,
            "points_per_win": self.points_per_win,
            "points_per_loss": self.points_per_loss,
            "categories": {
                name: cat.to_dict() for name, cat in self.categories.items()
            }
        }

    def __repr__(self) -> str:
        return f"Championship(name='{self.name}', rounds={self.rounds}, categories={len(self.categories)})"

