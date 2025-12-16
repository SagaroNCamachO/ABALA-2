"""
Módulo para generar fixtures (calendarios) de partidos.

Genera automáticamente los partidos ida y vuelta para cada vuelta del campeonato.
"""

from typing import List
try:
    from api.match import Match
except ImportError:
    from match import Match


class FixtureGenerator:
    """Genera fixtures automáticamente para un número de equipos y vueltas."""

    @staticmethod
    def generate_round_robin(teams: List[str], start_round: int, match_type: str = "ida") -> List[Match]:
        """
        Genera partidos para una vuelta usando el sistema round-robin.
        Distribuye los partidos en múltiples fechas.

        Args:
            teams: Lista de nombres de equipos
            start_round: Número de vuelta/fecha inicial
            match_type: Tipo de partido ('ida' o 'vuelta')

        Returns:
            Lista de partidos Match distribuidos en fechas
        """
        if len(teams) < 2:
            return []

        matches = []
        n = len(teams)
        num_dates = n - 1 if n % 2 == 0 else n

        # Si hay número impar de equipos, agregamos un "bye" temporal
        teams_list = list(teams)
        if n % 2 == 1:
            teams_list.append("BYE")

        # Algoritmo round-robin - cada iteración es una fecha
        for date_idx in range(num_dates):
            current_round = start_round + date_idx
            round_matches = []
            
            for j in range(n // 2):
                home = teams_list[j]
                away = teams_list[n - 1 - j]

                # Ignorar partidos con BYE
                if home != "BYE" and away != "BYE":
                    if date_idx % 2 == 0:
                        match = Match(home, away, current_round, match_type)
                    else:
                        # Alternar localía
                        match = Match(away, home, current_round, match_type)
                    round_matches.append(match)

            matches.extend(round_matches)

            # Rotar equipos (excepto el primero)
            if date_idx < num_dates - 1:
                teams_list = [teams_list[0]] + [teams_list[-1]] + teams_list[1:-1]

        return matches

    @staticmethod
    def generate_fixture(teams: List[str], rounds: int) -> List[Match]:
        """
        Genera el fixture completo (ida y vuelta) para todas las vueltas.

        Args:
            teams: Lista de nombres de equipos
            rounds: Número de vueltas del campeonato

        Returns:
            Lista completa de partidos Match
        """
        all_matches = []
        n = len(teams)
        # Número de fechas necesarias para que todos jueguen contra todos (una vez)
        total_rounds_per_cycle = n - 1 if n % 2 == 0 else n
        current_round = 1

        for cycle in range(rounds):
            # Generar partidos de ida
            ida_matches = FixtureGenerator.generate_round_robin(
                teams,
                start_round=current_round,
                match_type="ida"
            )
            all_matches.extend(ida_matches)
            current_round += total_rounds_per_cycle

            # Generar partidos de vuelta (si hay más de una vuelta o se requiere)
            if rounds > 1 or cycle == 0:
                vuelta_matches = FixtureGenerator.generate_round_robin(
                    teams,
                    start_round=current_round,
                    match_type="vuelta"
                )
                # Invertir localía en vuelta
                for match in vuelta_matches:
                    match.team_a, match.team_b = match.team_b, match.team_a
                all_matches.extend(vuelta_matches)
                current_round += total_rounds_per_cycle

        return all_matches

    @staticmethod
    def get_matches_by_round(matches: List[Match], round_number: int) -> List[Match]:
        """
        Filtra partidos por número de vuelta.

        Args:
            matches: Lista de partidos
            round_number: Número de vuelta

        Returns:
            Lista de partidos de esa vuelta
        """
        return [m for m in matches if m.round_number == round_number]

    @staticmethod
    def get_matches_by_team(matches: List[Match], team_name: str) -> List[Match]:
        """
        Filtra partidos de un equipo específico.

        Args:
            matches: Lista de partidos
            team_name: Nombre del equipo

        Returns:
            Lista de partidos del equipo
        """
        return [m for m in matches if m.team_a == team_name or m.team_b == team_name]

