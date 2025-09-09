import mongoose, { Schema } from "mongoose";

/**
 * Modèle Mongoose pour les annonces (listings) — troc & dons
 */
const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, minLength: 20 },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          // demande au moins une image pour les annonces publiées
          if (!Array.isArray(arr)) return false;
          return arr.length > 0;
        },
        message: "Au moins une image est requise",
      },
    },
    condition: {
      type: String,
      enum: ["new", "like_new", "used"],
      default: "used",
    },
    type: { type: String, enum: ["swap", "donate"], required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["available", "reserved", "completed"],
      default: "available",
    },
    location: {
      address: { type: String, default: null },
      postalCode: { type: String, default: null },
      coords: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    interestedUsers: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Listing = mongoose.model("Listing", listingSchema);

// normalisation avant sauvegarde
listingSchema.pre("save", function (next) {
  if (this.description && typeof this.description === "string") {
    this.description = this.description.trim();
  }
  next();
});

export default Listing;
