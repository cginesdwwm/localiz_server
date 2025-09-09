import mongoose, { Schema } from "mongoose";

/**
 * Modèle Mongoose pour les 'Deals' (bons plans, offres)
 * Utilisé côté backend pour stocker des offres/deals créés par des utilisateurs.
 */
const dealSchema = new mongoose.Schema(
  {
    // Image principale (URL)
    image: { type: String, required: true },

    // Titre de l'événement / promo
    title: { type: String, required: true, trim: true },

    // Lieu : nom du commerce, adresse ou zone
    location: {
      name: { type: String, default: null },
      address: { type: String, default: null },
      zone: { type: String, default: null },
    },

    // Dates : startDate obligatoire, endDate optionnel (si event sur plusieurs jours)
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },

    // Conditions d'accès (entrée gratuite, tarif, reservation, reduction)
    accessConditions: {
      type: {
        type: String,
        enum: ["free", "paid", "reservation", "reduction"],
        default: "free",
      },
      price: { type: Number, default: null },
    },

    // Site internet éventuel
    website: { type: String, default: null },

    // Description détaillée
    description: { type: String, required: true, minLength: 20 },

    // Métadonnées et liens
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["open", "hidden", "cancelled"],
      default: "open",
    },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    viewedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Deal = mongoose.model("Deal", dealSchema);

export default Deal;
