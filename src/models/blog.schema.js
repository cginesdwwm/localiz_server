/*
  Ce fichier est un modèle Mongoose pour une ressource "Blog".
  Il définit la structure des données pour un document de blog dans la base de données MongoDB.
*/

import mongoose, { Schema } from "mongoose";

// Définition du schéma Mongoose pour un blog.
// Le schéma définit les champs, leurs types, et les contraintes de validation.
const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minLength: 3 },
    content: { type: String, required: true, minLength: 10 },
    image: { type: String, default: null },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
