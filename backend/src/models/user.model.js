import mongoose, { Schema } from "mongoose";

const userScheme = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, default: null, select: false },
  name: { type: String, default: "" },
  email: { type: String, sparse: true, unique: true },
  googleId: { type: String, sparse: true, unique: true },
  token: { type: String, select: false }
});

const User = mongoose.model("User", userScheme);

export { User };
