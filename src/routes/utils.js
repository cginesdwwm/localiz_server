import express from "express";
import Postal from "../models/postalcode.schema.js";

// Use global fetch when available (Node 18+). If not available, try a dynamic
// import of `node-fetch` at runtime so the package is optional for modern Node.
let fetchFn = globalThis.fetch;
let AbortControllerRef = globalThis.AbortController;
if (!fetchFn) {
  try {
    // dynamic import so bundlers / older environments can still run
    const mod = await import("node-fetch");
    fetchFn = mod.default ?? mod;
    // node-fetch v3 exports AbortController separately
    if (!AbortControllerRef) {
      try {
        const ac = await import("abort-controller");
        AbortControllerRef = ac.default ?? ac;
      } catch {
        // fallback to AbortController from node-fetch if available
        AbortControllerRef = mod.AbortController || globalThis.AbortController;
      }
    }
  } catch (e) {
    // leave fetchFn undefined; later code will throw a clear error
    fetchFn = undefined;
  }
}

const router = express.Router();

// GET /utils/postal-to-town/:postalCode
// Tries DB cache first, otherwise queries zippopotam.us and upserts into DB.
router.get("/postal-to-town/:postalCode", async (req, res) => {
  try {
    const { postalCode } = req.params;
    if (!postalCode)
      return res.status(400).json({ message: "Postal code missing" });

    const country = "FR";

    // Check DB cache
    const cached = await Postal.findOne({ country, postalCode }).lean();
    if (cached) {
      // Optionally increment hits asynchronously
      Postal.updateOne({ _id: cached._id }, { $inc: { hits: 1 } }).catch(
        () => {}
      );
      return res.json({ town: cached.town, source: "db" });
    }

    // Remote lookup
    if (!fetchFn) {
      throw new Error(
        "Fetch is not available in this runtime. Please use Node 18+ or install node-fetch."
      );
    }

    const url = `https://api.zippopotam.us/FR/${encodeURIComponent(
      postalCode
    )}`;
    // Implement timeout using AbortController for portability
    const controller = AbortControllerRef
      ? new AbortControllerRef()
      : new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let r;
    try {
      r = await fetchFn(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!r || !r.ok) {
      return res.status(200).json({ town: null, source: "none" });
    }
    const data = await r.json();
    const place =
      data.places && data.places[0] ? data.places[0]["place name"] : null;

    if (place) {
      // Upsert into DB with a 90-day expiry by default
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await Postal.findOneAndUpdate(
        { country, postalCode },
        {
          $set: { town: place, source: "zippopotam", expiresAt },
          $inc: { hits: 1 },
        },
        { upsert: true }
      );
    }

    res.json({ town: place || null, source: "remote" });
  } catch (err) {
    res.status(500).json({ town: null, error: err.message });
  }
});

export default router;
