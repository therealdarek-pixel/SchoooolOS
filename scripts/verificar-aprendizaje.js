const { MongoClient } = require('mongodb');
const URI = "mongodb+srv://therealdarek_db_user:Nv18WwdCjP34Bglr@cluster0.i7xsdaa.mongodb.net/schoolos";

async function verificar() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db('schoolos');
    
    const tema = await db.collection('temas').findOne({
      titulo: { $regex: "normalizaci", $options: "i" },
      aprobado: true
    });
    
    if (!tema) {
      console.log("❌ No se encontró el tema");
      return;
    }
    
    console.log(`📘 Tema: ${tema.titulo}`);
    console.log(`\n🔑 Palabras clave (${tema.palabras_clave?.length || 0}):`);
    (tema.palabras_clave || []).forEach(p => console.log(`  • ${p}`));
    
  } finally {
    await client.close();
  }
}

verificar();