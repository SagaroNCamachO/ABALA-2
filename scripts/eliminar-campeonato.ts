/**
 * Script para eliminar un campeonato específico de MongoDB
 * Uso: npx ts-node scripts/eliminar-campeonato.ts <champId>
 * Ejemplo: npx ts-node scripts/eliminar-campeonato.ts campeonato_2025_imported
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'abala_championships';
const COLLECTION_NAME = 'championships';

async function eliminarCampeonato(champId: string) {
  console.log('🗑️  Eliminando campeonato de MongoDB...\n');
  console.log(`📋 ID del campeonato: ${champId}`);
  console.log(`🔗 URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}\n`);

  let client: MongoClient | null = null;

  try {
    // Conectar a MongoDB
    console.log('1️⃣ Conectando a MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('   ✅ Conexión exitosa\n');

    // Obtener la base de datos y colección
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Verificar si existe el campeonato
    console.log('2️⃣ Verificando si existe el campeonato...');
    const existing = await collection.findOne({ _id: champId as any });
    
    if (!existing) {
      console.log('   ⚠️  El campeonato no existe en MongoDB');
      console.log('   💡 Puede que ya haya sido eliminado o nunca existió\n');
      return;
    }

    console.log('   ✅ Campeonato encontrado');
    console.log(`   📝 Nombre: ${existing.data?.name || 'Sin nombre'}`);
    console.log(`   📅 Actualizado: ${existing.updatedAt || 'N/A'}\n`);

    // Confirmar eliminación
    console.log('3️⃣ Eliminando campeonato...');
    const result = await collection.deleteOne({ _id: champId as any });

    if (result.deletedCount === 1) {
      console.log('   ✅ Campeonato eliminado exitosamente\n');
      console.log('📊 Resumen:');
      console.log(`   ✅ Eliminado: ${champId}`);
      console.log(`   📝 Nombre: ${existing.data?.name || 'Sin nombre'}\n`);
    } else {
      console.log('   ⚠️  No se pudo eliminar el campeonato\n');
    }

  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
    console.log('\n💡 Verifica:');
    console.log('   - Que la URI de MongoDB sea correcta');
    console.log('   - Que tengas permisos para eliminar documentos');
    console.log('   - Que el ID del campeonato sea correcto\n');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Obtener el ID del campeonato desde los argumentos
const champId = process.argv[2];

if (!champId) {
  console.error('❌ Error: Debes proporcionar el ID del campeonato');
  console.log('\n📖 Uso:');
  console.log('   npx ts-node scripts/eliminar-campeonato.ts <champId>');
  console.log('\n📝 Ejemplo:');
  console.log('   npx ts-node scripts/eliminar-campeonato.ts campeonato_2025_imported\n');
  process.exit(1);
}

// Ejecutar eliminación
eliminarCampeonato(champId).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

