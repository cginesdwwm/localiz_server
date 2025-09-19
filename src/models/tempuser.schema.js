import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema(
  {
    // Optional at registration; collected later in ManageAccount
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    // Phone and postalCode are optional during registration
    // phone kept unique but sparse so null/undefined values are allowed
    phone: { type: String, unique: true, sparse: true },
    postalCode: { type: String },
    city: { type: String, default: null },
    // birthday remains required for age check; gender is optional
    birthday: { type: Date, required: true },
    gender: { type: String },
    agreeToTerms: { type: Boolean, required: true, default: false },
    password: { type: String, required: true },
    token: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Ajout d'un index avec une durée de vie (TTL) pour supprimer les utilisateurs non vérifiés après 1 heure
tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const TempUser = mongoose.model("TempUser", tempUserSchema);

export default TempUser;
