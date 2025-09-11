import mongoose, { Schema } from "mongoose";

const ratingSchema = new mongoose.Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
  value: { type: Number, min: 1, max: 5, required: true },
});

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
