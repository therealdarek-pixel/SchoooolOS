const { MongoClient } = require('mongodb');

const URI = "mongodb+srv://therealdarek_db_user:Nv18WwdCjP34Bglr@cluster0.i7xsdaa.mongodb.net/schoolos";

async function verificar() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db('schoolos');
    
    // Contar total de temas aprobados
    const total = await db.collection('temas').countDocuments({ aprobado: true });
    console.log(`📊 Total temas aprobados: ${total}`);
    
    // Buscar temas que contengan "normaliz" en el título o palabras clave
    const normalizacion = await db.collection('temas').find({
      $or: [
        { titulo: { $regex: "normaliz", $options: "i" } },
        { palabras_clave: { $regex: "normaliz", $options: "i" } }
      ],
      aprobado: true
    }).toArray();
    
    console.log(`\n🔍 Temas con "normaliz": ${normalizacion.length}`);
    normalizacion.forEach(t => {
      console.log(`  • ${t.titulo} (materia: ${t.materia})`);
    });
    
  } finally {
    await client.close();
  }
}

verificar();