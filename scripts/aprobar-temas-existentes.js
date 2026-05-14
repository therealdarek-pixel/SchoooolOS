const { MongoClient } = require('mongodb');

const URI = "mongodb+srv://therealdarek_db_user:Nv18WwdCjP34Bglr@cluster0.i7xsdaa.mongodb.net/schoolos";

async function aprobarTodos() {
  const client = new MongoClient(URI);
  
  try {
    await client.connect();
    const db = client.db('schoolos');
    const temas = db.collection('temas');
    
    const resultado = await temas.updateMany(
      {},
      { $set: { aprobado: true } }
    );
    
    console.log(`✅ ${resultado.modifiedCount} temas marcados como aprobados`);
    console.log(`📊 Total de temas en BD: ${await temas.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

aprobarTodos();