const { MongoClient } = require('mongodb');
const URI = "mongodb+srv://therealdarek_db_user:Nv18WwdCjP34Bglr@cluster0.i7xsdaa.mongodb.net/schoolos";

async function limpiar() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db('schoolos');
    
    // Buscar temas con materias mal escritas
    const codigosCorrectos = ["BD-REL", "BD-NOSQL", "ENG"];
    
    const temasMalos = await db.collection('temas').find({
      materia: { $nin: codigosCorrectos }
    }).toArray();
    
    console.log(`🔍 Encontrados ${temasMalos.length} temas con materia mal escrita:`);
    temasMalos.forEach(t => {
      console.log(`  • ${t.titulo} → "${t.materia}"`);
    });
    
    if (temasMalos.length === 0) {
      console.log("✅ No hay temas con materia mal escrita");
      return;
    }
    
    console.log("\n⚠️ Eliminando estos temas...");
    const resultado = await db.collection('temas').deleteMany({
      materia: { $nin: codigosCorrectos }
    });
    
    console.log(`✅ ${resultado.deletedCount} temas eliminados`);
    
    const total = await db.collection('temas').countDocuments({ aprobado: true });
    console.log(`📊 Total temas aprobados ahora: ${total}`);
    
  } finally {
    await client.close();
  }
}

limpiar();