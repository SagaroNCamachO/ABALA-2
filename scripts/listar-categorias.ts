/**
 * Script para listar todas las categorías y sus equipos
 * Uso: npx ts-node scripts/listar-categorias.ts
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'abala_championships';
const COLLECTION_NAME = 'championships';

async function listarCategorias() {
  console.log('📋 Listando categorías y equipos desde MongoDB...\n');

  let client: MongoClient | null = null;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    const docs = await collection.find({}).toArray();

    if (docs.length === 0) {
      console.log('⚠️  No hay campeonatos en la base de datos\n');
      return;
    }

    console.log(`📊 Encontrados ${docs.length} campeonato(s)\n`);
    console.log('='.repeat(80));
    console.log('');

    for (const doc of docs) {
      const id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
      const data = doc.data || {};
      const name = data.name || 'Sin nombre';

      console.log(`🏆 CAMPEONATO: ${name}`);
      console.log(`   ID: ${id}`);
      console.log(`   Vueltas: ${data.rounds || 'N/A'}`);
      console.log('');

      if (data.categories && Object.keys(data.categories).length > 0) {
        console.log(`   📁 CATEGORÍAS (${Object.keys(data.categories).length}):`);
        console.log('');

        for (const [catName, catData] of Object.entries(data.categories)) {
          const cat = catData as any;
          const teams = cat.teams || [];
          const teamNames = teams.map((t: any) => t.name || t);

          console.log(`   ┌─ 📂 ${catName}`);
          console.log(`   │  Equipos (${teamNames.length}):`);
          if (teamNames.length > 0) {
            teamNames.forEach((team: string, index: number) => {
              console.log(`   │    ${index + 1}. ${team}`);
            });
          } else {
            console.log(`   │    (Sin equipos)`);
          }
          console.log(`   │  Partidos: ${cat.matches?.length || 0}`);
          console.log(`   │`);
          console.log(`   │  Para recrear esta categoría:`);
          console.log(`   │  1. Eliminar: DELETE /api/championships/${id}/categories/${encodeURIComponent(catName)}`);
          console.log(`   │  2. Crear con equipos: ${JSON.stringify(teamNames)}`);
          console.log(`   └─────────────────────────────────────────────────────────`);
          console.log('');
        }
      } else {
        console.log('   ⚠️  No hay categorías en este campeonato');
        console.log('');
      }

      console.log('='.repeat(80));
      console.log('');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Verifica:');
    console.log('   - Que la URI de MongoDB sea correcta');
    console.log('   - Que tengas permisos para leer documentos\n');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
listarCategorias().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

