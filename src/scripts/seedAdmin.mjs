import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });

import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/user.schema.js";
import { connectDB } from "../lib/db.js";

if (!process.env.MONGO_URI) {
  console.error("❌ Erreur : MONGO_URI manquant dans le fichier .env");
  process.exit(1);
}

// Connexion à la base de données
await connectDB();

// Les champs suivants sont requis par le schéma, ils doivent donc être fournis
const email = process.env.ADMIN_EMAIL || "adminlocaliz@gmail.com";
const password = process.env.ADMIN_PASSWORD || "Localiz!0207";
const firstName = "Admin";
const lastName = "Localiz";
const username = "admin";
const phone = "0667866697";
const postalCode = "62400";
const birthday = "1995-07-02";
const gender = "female";
const agreeToTerms = true;

try {
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("⚠️ Admin déjà existant:", email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    firstName,
    lastName,
    username,
    email,
    phone,
    postalCode,
    birthday,
    gender,
    agreeToTerms,
    password: hashed,
    role: "admin",
  });

  console.log("✅ Compte admin créé :", email);
} catch (error) {
  console.error("❌ Erreur lors de la création de l'admin:", error);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
