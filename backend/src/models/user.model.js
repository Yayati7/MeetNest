import mongoose, { Schema } from "mongoose";

const userScheme = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String }
});

const User = mongoose.model("User", userScheme);

export { User };
