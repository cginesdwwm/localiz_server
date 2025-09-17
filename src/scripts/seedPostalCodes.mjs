import mongoose from "mongoose";
import dotenv from "dotenv";
import Postal from "../models/postalcode.schema.js";

dotenv.config();

const MONGO_URL =
  process.env.MONGO_URL ||
  process.env.DATABASE_URL ||
  "mongodb://127.0.0.1:27017/localiz";

// Grouped seed data by region for readability and maintenance.
const SEED_BY_REGION = {
  "Ile-de-France": [{ postalCode: "75001", town: "Paris" }],
  "Auvergne-Rhône-Alpes": [{ postalCode: "69001", town: "Lyon" }],
  "Provence-Alpes-Côte d'Azur": [
    { postalCode: "13001", town: "Marseille" },
    { postalCode: "06000", town: "Nice" },
  ],
  Occitanie: [{ postalCode: "31000", town: "Toulouse" }],
  "Pays de la Loire": [{ postalCode: "44000", town: "Nantes" }],
  "Grand Est": [{ postalCode: "67000", town: "Strasbourg" }],
  "Nouvelle-Aquitaine": [
    { postalCode: "33000", town: "Bordeaux" },
    { postalCode: "34000", town: "Montpellier" },
  ],
  "Hauts-de-France": [
    // Nord (59)
    { postalCode: "59000", town: "Lille" },
    { postalCode: "59100", town: "Roubaix" },
    { postalCode: "59200", town: "Tourcoing" },
    { postalCode: "59140", town: "Dunkerque" },
    { postalCode: "59300", town: "Valenciennes" },
    { postalCode: "59500", town: "Douai" },
    { postalCode: "59600", town: "Maubeuge" },

    // Pas-de-Calais (62)
    { postalCode: "62000", town: "Arras" },
    { postalCode: "62100", town: "Calais" },
    { postalCode: "62110", town: "Hénin-Beaumont" },
    { postalCode: "62200", town: "Boulogne-sur-Mer" },
    { postalCode: "62300", town: "Lens" },
    { postalCode: "62400", town: "Béthune" },
    { postalCode: "62500", town: "Saint-Omer" },

    // Somme (80)
    { postalCode: "80000", town: "Amiens" },
    { postalCode: "80100", town: "Abbeville" },

    // Oise (60)
    { postalCode: "60000", town: "Beauvais" },
    { postalCode: "60100", town: "Creil" },
    { postalCode: "60200", town: "Compiègne" },

    // Aisne (02)
    { postalCode: "02100", town: "Saint-Quentin" },
    { postalCode: "02000", town: "Laon" },
    { postalCode: "02200", town: "Soissons" },
  ],
};

// Flatten, normalize (trim), dedupe by postalCode, and sort by postalCode.
const SEED_LIST = Array.from(
  Object.values(SEED_BY_REGION)
    .flat()
    .reduce((map, item) => {
      const code = String(item.postalCode).trim();
      if (!map.has(code)) map.set(code, { postalCode: code, town: item.town });
      return map;
    }, new Map())
    .values()
).sort((a, b) => a.postalCode.localeCompare(b.postalCode));

async function main() {
  console.log("Connecting to DB:", MONGO_URL);
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected.");

  const country = "FR";
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  for (const item of SEED_LIST) {
    const filter = { country, postalCode: item.postalCode };
    const update = {
      $set: {
        town: item.town,
        source: "seed",
        expiresAt,
      },
      $setOnInsert: { hits: 0 },
    };

    const res = await Postal.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    console.log(`Upserted ${item.postalCode} -> ${item.town} (id=${res._id})`);
  }

  console.log("Done seeding postal codes.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
