import mongoose from "mongoose";

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

const emailValidator = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const UserSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      match: [
        addressRegex,
        "Address must start with 0x and be followed by 40 hexadecimal characters.",
      ],
    },
    addressReceiver: {
      type: String,
      required: true,
      match: [
        addressRegex,
        "Address must start with 0x and be followed by 40 hexadecimal characters.",
      ],
    },
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "USER", "FROG", "LUQUIDATOR"],
      default: "USER",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [emailValidator, "Please fill a valid email address."],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
