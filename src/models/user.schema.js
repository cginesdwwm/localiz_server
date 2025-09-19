/**
 * Schéma Mongoose pour les utilisateurs.
 * Contient les informations collectées à l'inscription.
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // First/last name made optional at registration; users can fill later
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    // Phone and postalCode optional during registration; phone unique but sparse
    phone: { type: String, unique: true, sparse: true },
    postalCode: { type: String },
    city: { type: String, default: null },
    profilePhoto: { type: String, default: null },
    birthday: { type: Date, required: true },
    gender: { type: String },
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
