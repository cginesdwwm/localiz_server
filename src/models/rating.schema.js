import mongoose, { Schema } from "mongoose";

// Désormais, une note cible un utilisateur (profil) plutôt qu'un billet de blog
const ratingSchema = new mongoose.Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

// Un seul rating par (auteur -> utilisateur cible)
ratingSchema.index({ author: 1, targetUser: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
