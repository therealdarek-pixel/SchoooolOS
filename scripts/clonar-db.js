import { MongoClient } from "mongodb";
import { config } from "dotenv";
config({ path: ".env.local" });

const SRC_DB = "schoolos";
const DST_DB = process.env.MONGODB_DB || "schoolos_dev";

if (SRC_DB === DST_DB) {
  throw new Error("Origen y destino son la misma BD. Aborto para no romper nada.");
}

const client = new MongoClient(process.env.MONGODB_URI);

async function main() {
  await client.connect();
  const src = client.db(SRC_DB);
  const dst = client.db(DST_DB);

  const cols = await src.listCollections().toArray();
  console.log(`Origen "${SRC_DB}" -> ${cols.length} colecciones`);

  for (const { name } of cols) {
    const srcCol = src.collection(name);
    const dstCol = dst.collection(name);

    const docs = await srcCol.find({}).toArray();
    if (docs.length > 0) {
      await dstCol.deleteMany({});
      await dstCol.insertMany(docs);
    }

    const indexes = await srcCol.indexes();
    for (const idx of indexes) {
      if (idx.name === "_id_") continue;
      const { key, name: indexName, v, ns, ...opts } = idx;
      try {
        await dstCol.createIndex(key, { name: indexName, ...opts });
      } catch (e) {
        console.warn(`  indice ${indexName} en ${name}: ${e.message}`);
      }
    }
    console.log(`  ${name}: ${docs.length} docs, ${indexes.length - 1} indices`);
  }

  console.log(`OK: ${SRC_DB} -> ${DST_DB}`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
