import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true }, // Rendu obligatoire et unique
    postalCode: { type: String, required: true },
    birthday: { type: Date, required: true },
    gender: { type: String, required: true },
    agreeToTerms: { type: Boolean, required: true, default: false },
    password: { type: String, required: true },
    token: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Ajout d'un index avec une durée de vie (TTL) pour supprimer les utilisateurs non vérifiés après 2 minutes
tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });

const TempUser = mongoose.model("TempUser", tempUserSchema);

export default TempUser;
