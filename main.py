"""
Archivo principal de ejecución del sistema de gestión de campeonatos de básquetbol.

Este archivo contiene ejemplos de uso del sistema completo.
"""

import json
from championship import Championship


def print_separator():
    """Imprime un separador visual."""
    print("\n" + "="*80 + "\n")


def print_standings(championship: Championship, category_name: str):
    """
    Imprime la tabla de posiciones de una categoría.

    Args:
        championship: Instancia del campeonato
        category_name: Nombre de la categoría
    """
    standings = championship.get_standings(category_name)
    if standings is None:
        print(f"Categoría '{category_name}' no encontrada.")
        return

    print(f"\n{'='*80}")
    print(f"TABLA DE POSICIONES - {category_name}")
    print(f"{'='*80}")
    print(f"{'Pos':<5} {'Equipo':<25} {'PJ':<5} {'PG':<5} {'PP':<5} {'PF':<5} {'PC':<5} {'Dif':<7} {'Pts':<5}")
    print("-"*80)

    for pos, team in enumerate(standings, 1):
        print(f"{pos:<5} {team.name:<25} {team.pj:<5} {team.pg:<5} {team.pp:<5} "
              f"{team.pf:<5} {team.pc:<5} {team.get_difference():<7} {team.points:<5}")

    print("="*80)


def print_fixture(championship: Championship, category_name: str, round_number: int = None):
    """
    Imprime el fixture de una categoría.

    Args:
        championship: Instancia del campeonato
        category_name: Nombre de la categoría
        round_number: Número de vuelta (opcional, si es None imprime todas)
    """
    category = championship.get_category(category_name)
    if category is None:
        print(f"Categoría '{category_name}' no encontrada.")
        return

    print(f"\n{'='*80}")
    print(f"FIXTURE - {category_name}")
    print(f"{'='*80}")

    if round_number is not None:
        matches = category.get_matches_by_round(round_number)
        print(f"\nVuelta {round_number}:")
        print("-"*80)
        for match in matches:
            if match.played:
                print(f"  {match.team_a:<20} {match.score_a:>3} - {match.score_b:<3} {match.team_b:<20} ({match.match_type})")
            else:
                print(f"  {match.team_a:<20}   -     {match.team_b:<20} ({match.match_type})")
    else:
        # Imprimir todas las vueltas
        max_round = max([m.round_number for m in category.matches]) if category.matches else 0
        for rnd in range(1, max_round + 1):
            matches = category.get_matches_by_round(rnd)
            if matches:
                print(f"\nVuelta {rnd}:")
                print("-"*80)
                for match in matches:
                    if match.played:
                        print(f"  {match.team_a:<20} {match.score_a:>3} - {match.score_b:<3} {match.team_b:<20} ({match.match_type})")
                    else:
                        print(f"  {match.team_a:<20}   -     {match.team_b:<20} ({match.match_type})")

    print("="*80)


def ejemplo_basico():
    """Ejemplo básico de uso del sistema."""
    print_separator()
    print("EJEMPLO 1: Campeonato básico con configuración simple")
    print_separator()

    # Crear campeonato
    champ = Championship(
        name="Campeonato Local 2024",
        rounds=1,
        points_per_win=2,
        points_per_loss=0
    )

    # Agregar categorías con número de equipos
    champ.add_category("TC", num_teams=4)
    champ.add_category("Senior", num_teams=3)
    champ.add_category("Super Senior", num_teams=3)

    # Mostrar fixtures
    print("\nFixture generado para TC:")
    print_fixture(champ, "TC")

    # Registrar algunos resultados (usando partidos reales del fixture)
    print("\n\nRegistrando resultados...")
    category = champ.get_category("TC")
    
    # Registrar partidos de la vuelta 1
    matches_round1 = category.get_matches_by_round(1)
    if matches_round1:
        for i, match in enumerate(matches_round1):
            score_a = 80 + (i * 5)  # Puntajes variados
            score_b = 70 + (i * 3)
            champ.register_match_result("TC", match.team_a, match.team_b, 1, score_a, score_b)
            print(f"  {match.team_a} {score_a} - {score_b} {match.team_b}")
    
    # Registrar un partido de la vuelta 2
    matches_round2 = category.get_matches_by_round(2)
    if matches_round2:
        match = matches_round2[0]
        champ.register_match_result("TC", match.team_a, match.team_b, 2, 85, 78)
        print(f"  {match.team_a} 85 - 78 {match.team_b}")

    # Mostrar tabla de posiciones
    print_standings(champ, "TC")


def ejemplo_completo():
    """Ejemplo completo con múltiples vueltas y equipos personalizados."""
    print_separator()
    print("EJEMPLO 2: Campeonato completo con múltiples vueltas")
    print_separator()

    # Crear campeonato con 2 vueltas
    champ = Championship(
        name="Campeonato Regional 2024",
        rounds=2,
        points_per_win=2,
        points_per_loss=0
    )

    # Agregar categorías con nombres de equipos personalizados
    champ.add_category_with_teams(
        "TC",
        ["Los Leones", "Los Tigres", "Los Halcones", "Los Águilas", "Los Lobos"]
    )

    champ.add_category_with_teams(
        "Senior",
        ["Veteranos A", "Veteranos B", "Veteranos C"],
        points_per_win=3  # Configuración diferente para esta categoría
    )

    # Mostrar fixture completo
    print_fixture(champ, "TC")

    # Obtener partidos reales del fixture para registrar resultados
    category = champ.get_category("TC")
    
    # Simular resultados de algunos partidos de la primera vuelta
    print("\n\nRegistrando resultados de algunos partidos...")
    
    # Registrar algunos partidos de la vuelta 1
    matches_round1 = category.get_matches_by_round(1)
    if matches_round1:
        for match in matches_round1[:2]:  # Registrar los primeros 2 partidos
            score_a = 85 + (hash(match.team_a) % 20)  # Puntaje simulado
            score_b = 70 + (hash(match.team_b) % 20)
            if score_a == score_b:
                score_a += 5  # Evitar empates
            champ.register_match_result("TC", match.team_a, match.team_b, 1, score_a, score_b)
            print(f"  {match.team_a} {score_a} - {score_b} {match.team_b}")

    # Registrar algunos partidos de la vuelta 2
    matches_round2 = category.get_matches_by_round(2)
    if matches_round2:
        for match in matches_round2[:1]:  # Registrar el primer partido
            score_a = 88 + (hash(match.team_a) % 15)
            score_b = 75 + (hash(match.team_b) % 15)
            if score_a == score_b:
                score_a += 3
            champ.register_match_result("TC", match.team_a, match.team_b, 2, score_a, score_b)
            print(f"  {match.team_a} {score_a} - {score_b} {match.team_b}")

    # Registrar algunos partidos de la vuelta 3
    matches_round3 = category.get_matches_by_round(3)
    if matches_round3:
        for match in matches_round3[:2]:  # Registrar los primeros 2 partidos
            score_a = 90 + (hash(match.team_a) % 18)
            score_b = 78 + (hash(match.team_b) % 18)
            if score_a == score_b:
                score_a += 4
            champ.register_match_result("TC", match.team_a, match.team_b, 3, score_a, score_b)
            print(f"  {match.team_a} {score_a} - {score_b} {match.team_b}")

    # Mostrar tabla de posiciones
    print_standings(champ, "TC")

    # Aplicar una multa de puntos
    print("\n\nAplicando multa de 2 puntos a 'Los Halcones'...")
    champ.apply_penalty("TC", "Los Halcones", 2)
    print_standings(champ, "TC")


def ejemplo_exportar_json():
    """Ejemplo de exportación a JSON."""
    print_separator()
    print("EJEMPLO 3: Exportación a JSON")
    print_separator()

    champ = Championship(name="Campeonato Ejemplo", rounds=1)
    champ.add_category_with_teams("TC", ["Equipo A", "Equipo B", "Equipo C"])

    # Registrar algunos resultados
    champ.register_match_result("TC", "Equipo A", "Equipo B", 1, 100, 95)
    champ.register_match_result("TC", "Equipo C", "Equipo A", 1, 88, 92)

    # Exportar a JSON
    data = champ.to_dict()
    json_output = json.dumps(data, indent=2, ensure_ascii=False)

    print("Datos del campeonato en formato JSON:")
    print(json_output)

    # Guardar en archivo
    with open("championship_data.json", "w", encoding="utf-8") as f:
        f.write(json_output)
    print("\n[OK] Datos guardados en 'championship_data.json'")


def main():
    """Función principal que ejecuta todos los ejemplos."""
    print("\n" + "="*80)
    print("SISTEMA DE GESTIÓN DE CAMPEONATOS DE BÁSQUETBOL")
    print("="*80)

    try:
        ejemplo_basico()
        ejemplo_completo()
        ejemplo_exportar_json()

        print_separator()
        print("[OK] Todos los ejemplos se ejecutaron correctamente")
        print_separator()

    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

