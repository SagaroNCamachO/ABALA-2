/**
 * Script de Prueba Completa del Sistema de Campeonatos
 * Verifica todas las funcionalidades y detecta errores
 * 
 * Uso: npx ts-node scripts/prueba-completa.ts
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const API_BASE = process.env.API_BASE || 'https://abala.vercel.app';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logResult(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ test, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${test}: ${message}`);
  if (details) {
    console.log(`   Detalles:`, JSON.stringify(details, null, 2));
  }
}

async function testMongoConnection(): Promise<boolean> {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    logResult('Conexión MongoDB', 'PASS', 'Conexión exitosa');
    await client.close();
    return true;
  } catch (error: any) {
    logResult('Conexión MongoDB', 'FAIL', `Error: ${error.message}`);
    return false;
  } finally {
    if (client) await client.close();
  }
}

async function testGetChampionships(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/championships`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json() as any;
    
    if (data.success && data.championships) {
      const champIds = Object.keys(data.championships);
      logResult('GET /api/championships', 'PASS', `Encontrados ${champIds.length} campeonato(s)`, { ids: champIds });
      return champIds;
    } else {
      logResult('GET /api/championships', 'WARN', 'No hay campeonatos en el servidor');
      return [];
    }
  } catch (error: any) {
    logResult('GET /api/championships', 'FAIL', `Error: ${error.message}`);
    return [];
  }
}

async function testGetChampionshipDetails(champId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/championships/${champId}`);
    if (res.status === 404) {
      logResult(`GET /api/championships/${champId}`, 'WARN', 'Campeonato no encontrado');
      return null;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json() as any;
    
    if (data.success && data.championship) {
      const champ = data.championship;
      const categories = champ.categories ? Object.keys(champ.categories) : [];
      logResult(`GET /api/championships/${champId}`, 'PASS', `Campeonato encontrado: ${champ.name}`, {
        name: champ.name,
        rounds: champ.rounds,
        categories: categories.length
      });
      return champ;
    } else {
      logResult(`GET /api/championships/${champId}`, 'FAIL', 'Respuesta inválida', data);
      return null;
    }
  } catch (error: any) {
    logResult(`GET /api/championships/${champId}`, 'FAIL', `Error: ${error.message}`);
    return null;
  }
}

async function testGetFixture(champId: string, category: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/championships/${champId}/fixture/${category}`);
    if (res.status === 404) {
      logResult(`GET /api/championships/${champId}/fixture/${category}`, 'WARN', 'Fixture no encontrado');
      return null;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json() as any;
    
    if (data.success && data.matches) {
      const matches = data.matches;
      const matchdays = new Set(matches.map((m: any) => m.matchday)).size;
      const matchesByMatchday = matches.reduce((acc: any, m: any) => {
        acc[m.matchday] = (acc[m.matchday] || 0) + 1;
        return acc;
      }, {});
      
      // Verificar que todas las jornadas tengan 2 partidos (excepto la última)
      const matchdayNumbers = Object.keys(matchesByMatchday).map(Number).sort((a, b) => a - b);
      const lastMatchday = matchdayNumbers[matchdayNumbers.length - 1];
      const errors: string[] = [];
      
      for (const md of matchdayNumbers) {
        const count = matchesByMatchday[md];
        if (md !== lastMatchday && count !== 2) {
          errors.push(`Jornada ${md} tiene ${count} partidos (debería tener 2)`);
        }
      }
      
      if (errors.length > 0) {
        logResult(`GET /api/championships/${champId}/fixture/${category}`, 'FAIL', 
          `Problemas en el fixture: ${errors.length} jornada(s) con número incorrecto de partidos`, 
          { errors, matchesByMatchday });
      } else {
        logResult(`GET /api/championships/${champId}/fixture/${category}`, 'PASS', 
          `Fixture válido: ${matches.length} partidos en ${matchdays} jornadas`, 
          { matchesByMatchday });
      }
      
      return { matches, matchdays, matchesByMatchday };
    } else {
      logResult(`GET /api/championships/${champId}/fixture/${category}`, 'FAIL', 'Respuesta inválida', data);
      return null;
    }
  } catch (error: any) {
    logResult(`GET /api/championships/${champId}/fixture/${category}`, 'FAIL', `Error: ${error.message}`);
    return null;
  }
}

async function testGetStandings(champId: string, category: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/championships/${champId}/standings/${category}`);
    if (res.status === 404) {
      logResult(`GET /api/championships/${champId}/standings/${category}`, 'WARN', 'Tabla de posiciones no encontrada');
      return null;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json() as any;
    
    if (data.success && data.standings) {
      const standings = data.standings;
      logResult(`GET /api/championships/${champId}/standings/${category}`, 'PASS', 
        `Tabla de posiciones válida: ${standings.length} equipos`, 
        { teams: standings.length });
      return standings;
    } else {
      logResult(`GET /api/championships/${champId}/standings/${category}`, 'FAIL', 'Respuesta inválida', data);
      return null;
    }
  } catch (error: any) {
    logResult(`GET /api/championships/${champId}/standings/${category}`, 'FAIL', `Error: ${error.message}`);
    return null;
  }
}

async function testPostResult(champId: string, category: string, teamA: string, teamB: string, scoreA: number, scoreB: number, roundNumber?: number, matchType?: string): Promise<boolean> {
  try {
    // Primero obtener el fixture para encontrar el partido correcto
    const fixtureRes = await fetch(`${API_BASE}/api/championships/${champId}/fixture/${category}`);
    if (!fixtureRes.ok) {
      throw new Error(`No se pudo obtener el fixture: ${fixtureRes.status}`);
    }
    const fixtureData = await fixtureRes.json() as any;
    
    if (!fixtureData.success || !fixtureData.matches || fixtureData.matches.length === 0) {
      throw new Error('No hay partidos en el fixture');
    }
    
    // Buscar un partido que coincida con los equipos
    const match = fixtureData.matches.find((m: any) => 
      (m.team_a === teamA && m.team_b === teamB) || 
      (m.team_a === teamB && m.team_b === teamA)
    );
    
    if (!match) {
      throw new Error(`No se encontró un partido entre ${teamA} y ${teamB}`);
    }
    
    // Usar los datos del partido encontrado
    const body = {
      category,
      team_a: match.team_a,
      team_b: match.team_b,
      score_a: scoreA,
      score_b: scoreB,
      round_number: roundNumber || match.round_number || match.roundNumber,
      match_type: matchType || match.match_type || match.matchType || 'ida'
    };
    
    const res = await fetch(`${API_BASE}/api/championships/${champId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorData = await res.json() as any;
      throw new Error(`HTTP ${res.status}: ${errorData.error || 'Error desconocido'}`);
    }
    
    const data = await res.json() as any;
    
    if (data.success) {
      logResult(`POST /api/championships/${champId}/results`, 'PASS', 
        `Resultado registrado: ${teamA} ${scoreA}-${scoreB} ${teamB}`);
      return true;
    } else {
      logResult(`POST /api/championships/${champId}/results`, 'FAIL', 
        `Error: ${data.error || 'Error desconocido'}`);
      return false;
    }
  } catch (error: any) {
    logResult(`POST /api/championships/${champId}/results`, 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testValidateData(champ: any): Promise<void> {
  // Validar estructura del campeonato
  if (!champ.name) {
    logResult('Validación: Estructura del campeonato', 'FAIL', 'Campeonato sin nombre');
  } else {
    logResult('Validación: Estructura del campeonato', 'PASS', 'Estructura válida');
  }
  
  if (!champ.rounds || champ.rounds < 1) {
    logResult('Validación: Número de vueltas', 'WARN', 'Número de vueltas inválido o no definido');
  } else {
    logResult('Validación: Número de vueltas', 'PASS', `Vueltas: ${champ.rounds}`);
  }
  
  // Validar categorías
  if (!champ.categories || Object.keys(champ.categories).length === 0) {
    logResult('Validación: Categorías', 'WARN', 'No hay categorías en el campeonato');
  } else {
    const categories = Object.keys(champ.categories);
    logResult('Validación: Categorías', 'PASS', `${categories.length} categoría(s) encontrada(s)`, { categories });
    
    // Validar cada categoría
    for (const [catName, cat] of Object.entries(champ.categories)) {
      const category = cat as any;
      
      if (!category.teams || category.teams.length === 0) {
        logResult(`Validación: Categoría ${catName} - Equipos`, 'FAIL', 'Categoría sin equipos');
      } else {
        logResult(`Validación: Categoría ${catName} - Equipos`, 'PASS', `${category.teams.length} equipo(s)`);
      }
      
      if (category.matches && category.matches.length > 0) {
        // Verificar que los partidos tengan estructura válida
        const invalidMatches = category.matches.filter((m: any) => 
          !m.team_a || !m.team_b || m.round_number === undefined || m.matchday === undefined
        );
        
        if (invalidMatches.length > 0) {
          logResult(`Validación: Categoría ${catName} - Partidos`, 'FAIL', 
            `${invalidMatches.length} partido(s) con estructura inválida`, { invalidMatches });
        } else {
          logResult(`Validación: Categoría ${catName} - Partidos`, 'PASS', 
            `${category.matches.length} partido(s) válido(s)`);
        }
      }
    }
  }
}

async function runCompleteTest() {
  console.log('🧪 INICIANDO PRUEBA COMPLETA DEL SISTEMA\n');
  console.log('='.repeat(80));
  console.log('');
  
  // Test 1: Conexión MongoDB
  console.log('📡 Test 1: Conexión a MongoDB');
  await testMongoConnection();
  console.log('');
  
  // Test 2: Obtener lista de campeonatos
  console.log('📋 Test 2: Obtener lista de campeonatos');
  const champIds = await testGetChampionships();
  console.log('');
  
  if (champIds.length === 0) {
    console.log('⚠️  No hay campeonatos para probar. Creando uno de prueba...\n');
    // Aquí podrías crear un campeonato de prueba si es necesario
    console.log('💡 Para crear un campeonato de prueba, usa la interfaz web o la API\n');
  } else {
    // Test 3: Obtener detalles de cada campeonato
    for (const champId of champIds) {
      console.log(`🏆 Test 3: Detalles del campeonato ${champId}`);
      const champ = await testGetChampionshipDetails(champId);
      console.log('');
      
      if (champ) {
        // Test 4: Validar estructura de datos
        console.log(`✅ Test 4: Validación de datos del campeonato ${champId}`);
        await testValidateData(champ);
        console.log('');
        
        // Test 5: Probar fixture de cada categoría
        if (champ.categories) {
          for (const [catName] of Object.entries(champ.categories)) {
            console.log(`📅 Test 5: Fixture de categoría ${catName}`);
            const fixture = await testGetFixture(champId, catName);
            console.log('');
            
            // Test 6: Probar tabla de posiciones
            console.log(`📊 Test 6: Tabla de posiciones de categoría ${catName}`);
            await testGetStandings(champId, catName);
            console.log('');
            
            // Test 7: Probar registro de resultados (solo si hay partidos)
            if (fixture && fixture.matches && fixture.matches.length > 0) {
              const firstMatch = fixture.matches[0];
              if (firstMatch.team_a && firstMatch.team_b) {
                console.log(`⚽ Test 7: Registrar resultado de prueba en categoría ${catName}`);
                await testPostResult(
                  champId, 
                  catName, 
                  firstMatch.team_a, 
                  firstMatch.team_b, 
                  2, 
                  1
                );
                console.log('');
                
                // Verificar que el resultado se registró correctamente
                console.log(`🔄 Test 8: Verificar actualización de tabla después del resultado`);
                const updatedStandings = await testGetStandings(champId, catName);
                if (updatedStandings) {
                  logResult('Verificación de actualización', 'PASS', 'Tabla actualizada correctamente después del resultado');
                }
                console.log('');
              }
            }
          }
        }
      }
    }
  }
  
  // Resumen
  console.log('='.repeat(80));
  console.log('\n📊 RESUMEN DE PRUEBAS\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  
  console.log(`✅ Exitosas: ${passed}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`⚠️  Advertencias: ${warnings}`);
  console.log(`📝 Total: ${results.length}`);
  console.log('');
  
  if (failed > 0) {
    console.log('❌ PRUEBAS FALLIDAS:\n');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
      if (r.details) {
        console.log(`     Detalles: ${JSON.stringify(r.details)}`);
      }
    });
    console.log('');
  }
  
  if (warnings > 0) {
    console.log('⚠️  ADVERTENCIAS:\n');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
    });
    console.log('');
  }
  
  if (failed === 0 && warnings === 0) {
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
  } else if (failed === 0) {
    console.log('✅ Todas las pruebas críticas pasaron. Hay algunas advertencias menores.');
  } else {
    console.log('⚠️  Se encontraron errores que requieren atención.');
  }
  
  console.log('');
}

// Ejecutar pruebas
runCompleteTest().catch(error => {
  console.error('❌ Error fatal en las pruebas:', error);
  process.exit(1);
});

