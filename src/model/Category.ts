// src/model/Category.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  _id: string;
  name: string;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;