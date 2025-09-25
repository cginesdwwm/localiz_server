import mongoose from "mongoose";
import Rating from "../models/rating.schema.js";

// Créer ou mettre à jour une note pour un utilisateur cible
export const addOrUpdateRating = async (req, res) => {
  try {
    const { value } = req.body;
    const { userId } = req.params; // identifiant du profil à évaluer
    const authorId = req.user?._id;

    if (!userId) return res.status(400).json({ message: "userId requis" });

    let rating = await Rating.findOne({ targetUser: userId, author: authorId });
    if (rating) {
      rating.value = value;
      await rating.save();
      return res.status(200).json(rating);
    }

    rating = await Rating.create({
      value,
      targetUser: userId,
      author: authorId,
    });
    return res.status(201).json(rating);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Supprimer la note laissée par l'utilisateur connecté pour un utilisateur cible
export const deleteRating = async (req, res) => {
  try {
    const authorId = req.user?._id;
    const { userId } = req.params;
    const rating = await Rating.findOne({
      targetUser: userId,
      author: authorId,
    });
    if (!rating) return res.status(404).json({ message: "Note introuvable" });
    await rating.deleteOne();
    return res.status(200).json({ message: "Note supprimée" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Récupérer la moyenne et le nombre de notes d'un utilisateur
export const getUserRatingStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const agg = await Rating.aggregate([
      { $match: { targetUser: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$targetUser",
          count: { $sum: 1 },
          average: { $avg: "$value" },
        },
      },
    ]);
    const stats = agg[0] || { count: 0, average: null };
    return res.json(stats);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
