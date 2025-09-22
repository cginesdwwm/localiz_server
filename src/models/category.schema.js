import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["listing", "deal"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

CategorySchema.index({ type: 1, name: 1 }, { unique: true });

const Category = mongoose.model("Category", CategorySchema);
export default Category;
