// backend/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // sender can be Member, PT, or Admin
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // direct 1:1 message
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        fileUrl: String, // optional (images, PDFs, reports)
        fileType: String, // e.g., "image/png", "application/pdf"
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
