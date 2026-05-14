const { MongoClient } = require('mongodb');
const fs = require('fs');

const URI = "mongodb+srv://therealdarek_db_user:Nv18WwdCjP34Bglr@cluster0.i7xsdaa.mongodb.net/schoolos";

async function importar() {
  const client = new MongoClient(URI);
  
  try {
    await client.connect();
    const db = client.db('schoolos');
    const temas = db.collection('temas');
    
    // Lee los 3 archivos JSON
    const bdRel = JSON.parse(fs.readFileSync('bd-relacionales.json', 'utf8'));
    const bdNoSQL = JSON.parse(fs.readFileSync('bd-nosql.json', 'utf8'));
    const ingles = JSON.parse(fs.readFileSync('ingles.json', 'utf8'));
    
    // Inserta todos
    const resultado1 = await temas.insertMany(bdRel);
    console.log(`✅ ${resultado1.insertedCount} temas de BD Relacionales importados`);
    
    const resultado2 = await temas.insertMany(bdNoSQL);
    console.log(`✅ ${resultado2.insertedCount} temas de BD NoSQL importados`);
    
    const resultado3 = await temas.insertMany(ingles);
    console.log(`✅ ${resultado3.insertedCount} temas de Inglés importados`);
    
    console.log(`\n🎉 Total: ${resultado1.insertedCount + resultado2.insertedCount + resultado3.insertedCount} temas nuevos agregados`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

importar();