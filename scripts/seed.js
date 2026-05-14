/**
 * scripts/seed.ts
 * ---------------
 * Script actualizado que lee los 3 JSON masivos
 * e inserta toda la información en MongoDB.
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "schoolos";

if (!uri) {
  console.error("❌ Falta MONGODB_URI en .env.local");
  process.exit(1);
}

async function sembrar() {
  console.log("🌱 Conectando a MongoDB...");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  try {
    // ================================================
    // 1. Limpiar colecciones anteriores
    // ================================================
    console.log("\n🧹 Limpiando colecciones anteriores...");
    await db.collection("temas").deleteMany({});
    await db.collection("materias").deleteMany({});
    console.log("   ✅ Colecciones limpias");

    // ================================================
    // 2. Crear usuario maestro de prueba
    // ================================================
    console.log("\n👨‍🏫 Creando usuario maestro...");
    const usuariosCol = db.collection("usuarios");
    const existeMaestro = await usuariosCol.findOne({
      email: "maestro@schoolos.com",
    });

    let maestroId;
    if (existeMaestro) {
      console.log("   ⚠️  Ya existe, usando el existente");
      maestroId = existeMaestro._id.toString();
    } else {
      const hash = await bcrypt.hash("maestro123", 10);
      const res = await usuariosCol.insertOne({
        email: "maestro@schoolos.com",
        password: hash,
        nombre: "Profesor Demo",
        rol: "maestro",
        fecha_registro: new Date(),
      });
      maestroId = res.insertedId.toString();
      console.log("   ✅ maestro@schoolos.com / maestro123");
    }

    // ================================================
    // 3. Insertar las 3 materias
    // ================================================
    console.log("\n📚 Insertando materias...");
    const materiasCol = db.collection("materias");

    const materias = [
      {
        nombre: "Bases de Datos Relacionales",
        codigo: "BD-REL",
        descripcion: "SQL, normalización, joins, modelo E-R",
        color: "#3b82f6",
        icono: "🗄️",
      },
      {
        nombre: "Bases de Datos No Relacionales",
        codigo: "BD-NOSQL",
        descripcion: "MongoDB, documentos, colecciones, aggregation",
        color: "#10b981",
        icono: "🍃",
      },
      {
        nombre: "Inglés",
        codigo: "ENG",
        descripcion: "Gramática, vocabulario, pronunciación",
        color: "#f59e0b",
        icono: "🌍",
      },
    ];

    const materiasMap = {};
    for (const m of materias) {
      const existe = await materiasCol.findOne({ codigo: m.codigo });
      if (existe) {
        materiasMap[m.codigo] = existe._id.toString();
        console.log(`   ⚠️  Ya existe: ${m.nombre}`);
      } else {
        const res = await materiasCol.insertOne({
          ...m,
          maestro_id: maestroId,
        });
        materiasMap[m.codigo] = res.insertedId.toString();
        console.log(`   ✅ ${m.icono} ${m.nombre}`);
      }
    }

    // ================================================
    // 4. Leer e insertar los 3 JSON masivos
    // ================================================
    console.log("\n🧠 Insertando temas desde archivos JSON...");
    const temasCol = db.collection("temas");

    const archivos = [
      { archivo: "bd-relacionales.json", codigo: "BD-REL" },
      { archivo: "bd-nosql.json",        codigo: "BD-NOSQL" },
      { archivo: "ingles.json",          codigo: "ENG" },
    ];

    for (const { archivo, codigo } of archivos) {
      const rutaArchivo = path.join(__dirname, archivo);

      // Verificamos que el archivo existe
      if (!fs.existsSync(rutaArchivo)) {
        console.log(`   ⚠️  No encontré: ${archivo} (saltando)`);
        continue;
      }

      // Leemos y parseamos el JSON
      const contenido = fs.readFileSync(rutaArchivo, "utf-8");
      const temas = JSON.parse(contenido);
      const materiaId = materiasMap[codigo];

      let insertados = 0;
      let omitidos = 0;

      for (const tema of temas) {
        // Evitamos duplicados por título
        const existe = await temasCol.findOne({
          titulo: tema.titulo,
          materia_id: materiaId,
        });
        if (existe) {
          omitidos++;
          continue;
        }
        await temasCol.insertOne({
          ...tema,
          materia_id: materiaId,
          fecha_creacion: new Date(),
        });
        insertados++;
      }
      console.log(
        `   ✅ ${archivo}: ${insertados} insertados, ${omitidos} ya existían`
      );
    }

    // ================================================
    // RESUMEN
    // ================================================
    const totalUsuarios = await db.collection("usuarios").countDocuments();
    const totalMaterias = await materiasCol.countDocuments();
    const totalTemas    = await temasCol.countDocuments();

    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡SEED COMPLETADO!");
    console.log("=".repeat(50));
    console.log(`   👥 Usuarios:  ${totalUsuarios}`);
    console.log(`   📚 Materias:  ${totalMaterias}`);
    console.log(`   🧠 Temas:     ${totalTemas}`);
    console.log("=".repeat(50));
    console.log("\n💡 Cuenta de prueba:");
    console.log("   Email:    maestro@schoolos.com");
    console.log("   Password: maestro123\n");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Conexión cerrada");
  }
}

sembrar();