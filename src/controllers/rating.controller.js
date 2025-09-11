import Rating from "../models/rating.schema.js";

export const addOrUpdateRating = async (req, res) => {
  try {
    const { value } = req.body;
    const { blogId } = req.params;
    const { _id } = req.user;

    let rating = await Rating.findOne({ blog: blogId, author: _id });
    if (rating) {
      rating.value = value;
      await rating.save();
      return res.status(200).json(rating);
    }

    rating = await Rating.create({
      value,
      blog: blogId,
      author: _id,
    });

    return res.status(200).json(rating);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteRating = async (req, res) => {
  try {
    const { _id } = req.user;
    const { blogId } = req.params;
    const rating = await Rating.findOne({ blog: blogId, author: _id });
    if (!rating) {
      return res.status(400).json({ message: "Note déjà supprimée" });
    }
    await Rating.findOneAndDelete({ blog: blogId, author: _id });
    res.status(200).json({ message: "Note supprimée" });
  } catch (error) {
    console.log(error);
  }
};
