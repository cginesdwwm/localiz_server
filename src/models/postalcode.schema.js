import mongoose from "mongoose";

const postalSchema = new mongoose.Schema(
  {
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "FR" },
    town: { type: String, required: true },
    source: { type: String, default: "zippopotam" },
    hits: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

postalSchema.index({ country: 1, postalCode: 1 }, { unique: true });
// Optional: if expiresAt is set, documents will be removed after that date
postalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Postal = mongoose.model("PostalCode", postalSchema);
export default Postal;
