import mongoose from 'mongoose';
const { Schema } = mongoose;

const ForumSubSchema = new Schema({
  title: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ForumSub', ForumSubSchema);
