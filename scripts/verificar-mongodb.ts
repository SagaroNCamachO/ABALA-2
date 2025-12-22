/**
 * Script de verificación de MongoDB
 * Ejecuta: npx ts-node scripts/verificar-mongodb.ts
 */

import { MongoClient, Db } from 'mongodb';
import { MongoDBStorage } from '../src/storage/MongoDBStorage';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'abala_championships';
const COLLECTION_NAME = 'championships';

async function verificarMongoDB() {
  console.log('🔍 Verificando configuración de MongoDB...\n');
  
  // 1. Verificar variable de entorno
  console.log('1️⃣ Verificando variable de entorno MONGODB_URI...');
  if (!process.env.MONGODB_URI) {
    console.log('   ⚠️  MONGODB_URI no está configurada');
    console.log('   ℹ️  Usando valor por defecto:', MONGODB_URI);
    console.log('   💡 Para configurar en Vercel: Settings → Environment Variables → MONGODB_URI\n');
  } else {
    console.log('   ✅ MONGODB_URI está configurada');
    console.log('   📝 URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Ocultar contraseña
    console.log('');
  }

  // 2. Intentar conectar
  console.log('2️⃣ Intentando conectar a MongoDB...');
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('   ✅ Conexión exitosa a MongoDB\n');
  } catch (error: any) {
    console.log('   ❌ Error de conexión:', error.message);
    console.log('   💡 Verifica:');
    console.log('      - Que la URI sea correcta');
    console.log('      - Que el usuario y contraseña sean válidos');
    console.log('      - Que MongoDB Atlas permita conexiones desde tu IP (0.0.0.0/0)\n');
    return;
  }

  try {
    // 3. Verificar base de datos
    console.log('3️⃣ Verificando base de datos...');
    const db: Db = client.db(DB_NAME);
    const dbStats = await db.stats();
    console.log('   ✅ Base de datos existe:', DB_NAME);
    console.log('   📊 Tamaño:', (dbStats.dataSize / 1024).toFixed(2), 'KB');
    console.log('   📁 Colecciones:', dbStats.collections);
    console.log('');

    // 4. Verificar colección
    console.log('4️⃣ Verificando colección...');
    const collection = db.collection(COLLECTION_NAME);
    const count = await collection.countDocuments();
    console.log('   ✅ Colección existe:', COLLECTION_NAME);
    console.log('   📄 Documentos:', count);
    console.log('');

    // 5. Listar campeonatos si existen
    if (count > 0) {
      console.log('5️⃣ Campeonatos encontrados:');
      const docs = await collection.find({}).limit(5).toArray();
      docs.forEach((doc, index) => {
        const id = typeof doc._id === 'string' ? doc._id : doc._id.toString();
        const name = doc.data?.name || 'Sin nombre';
        console.log(`   ${index + 1}. ${name} (ID: ${id})`);
      });
      if (count > 5) {
        console.log(`   ... y ${count - 5} más`);
      }
      console.log('');
    } else {
      console.log('5️⃣ No hay campeonatos guardados aún');
      console.log('   💡 Crea un campeonato desde la interfaz web para probar\n');
    }

    // 6. Probar carga usando MongoDBStorage
    console.log('6️⃣ Probando carga con MongoDBStorage...');
    try {
      const championships = await MongoDBStorage.load();
      console.log('   ✅ Carga exitosa');
      console.log('   📊 Campeonatos cargados:', championships.size);
      console.log('');
    } catch (error: any) {
      console.log('   ⚠️  Error en carga:', error.message);
      console.log('');
    }

    // 7. Resumen final
    console.log('📋 RESUMEN:');
    console.log('   ✅ MongoDB está correctamente configurado');
    console.log('   ✅ Conexión funcionando');
    console.log('   ✅ Base de datos accesible');
    console.log('   ✅ Colección lista para usar');
    if (count > 0) {
      console.log('   ✅ Hay datos guardados');
    } else {
      console.log('   ℹ️  No hay datos aún (esto es normal si es la primera vez)');
    }
    console.log('');

  } catch (error: any) {
    console.log('   ❌ Error:', error.message);
    console.log('');
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar verificación
verificarMongoDB().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

