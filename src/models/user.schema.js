/**
 * Schéma Mongoose pour les utilisateurs.
 * Contient les informations collectées à l'inscription.
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    postalCode: { type: String, required: true },
    city: { type: String, default: null },
    profilePhoto: { type: String, default: null },
    birthday: { type: Date, required: true },
    gender: { type: String, required: true },
    bio: { type: String, default: "" },
    // profilePhoto: { type: String, required: true },
    agreeToTerms: { type: Boolean, required: true, default: false },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // User preferences
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    // Preferences about what to display publicly
    showFirstName: { type: Boolean, default: false },
    showCity: { type: Boolean, default: false },
    // Champs pour la réinitialisation de mot de passe
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Demande de suppression et état du compte
    disabled: { type: Boolean, default: false },
    deletionRequestedAt: Date,
    deletionReason: String,
    deletionDetails: String,
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Méthode pour ne pas renvoyer le mot de passe et d'autres champs sensibles.
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
