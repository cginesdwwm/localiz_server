/*
  db.js
  - Fichier responsable de la connexion à MongoDB via mongoose.
  - Exporte une fonction `connectDB` qui essaie de se connecter à l'URI
    fourni dans les variables d'environnement (process.env.MONGO_URI).
*/

import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connecté : ${connect.connection.host}`);
    return connect;
  } catch (error) {
    console.error("❌ MongoDB connection error", error.message);
    process.exit(1); // Stoppe le process si la connexion échoue
  }
};
