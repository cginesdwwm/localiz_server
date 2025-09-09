import mongoose from "mongoose";
import dotenv from "dotenv";
import Deal from "../src/models/deal.schema.js";

dotenv.config();

// Usage:
// node normalizeDealsAccessConditions.mjs [--dry] [--limit=N]
// --dry : do not write changes, only print what would change
// --limit=N : process at most N documents (for testing)

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = { dry: false, limit: null };
  for (const a of args) {
    if (a === "--dry") flags.dry = true;
    else if (a.startsWith("--limit=")) {
      const v = parseInt(a.split("=")[1], 10);
      if (!Number.isNaN(v) && v > 0) flags.limit = v;
    }
  }
  return flags;
}

async function main() {
  const { dry, limit } = parseArgs();

  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://localhost:27017/localiz";
  console.log(`Connecting to DB: ${uri.replace(/(:).*@/, "$1***@")}`);
  await mongoose.connect(uri);
  console.log("Connected to DB");

  const query = {};
  const cursor = Deal.find(query).cursor();
  let processed = 0;
  let updated = 0;

  for await (const doc of cursor) {
    if (limit && processed >= limit) break;
    processed += 1;

    const ac = doc.accessConditions;
    if (ac && typeof ac === "string") {
      const s = ac.toLowerCase();
      let newAc = { type: "free", price: null };
      if (s.includes("pay") || s.includes("€") || s.includes("eur"))
        newAc = { type: "paid", price: null };
      else if (s.includes("reserv"))
        newAc = { type: "reservation", price: null };
      else if (s.includes("reduct") || s.includes("reduc"))
        newAc = { type: "reduction", price: null };

      if (dry) {
        console.log(
          "[DRY] Would update",
          doc._id.toString(),
          "from",
          JSON.stringify(ac),
          "to",
          JSON.stringify(newAc)
        );
      } else {
        doc.accessConditions = newAc;
        await doc.save();
        console.log("Updated", doc._id.toString());
      }
      updated += 1;
    }
  }

  console.log(
    `Processed ${processed} documents, ${updated} updated${
      dry ? " (dry-run)" : ""
    }`
  );
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
