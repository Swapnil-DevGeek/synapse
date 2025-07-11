import mongoose, { Schema } from 'mongoose';

const NoteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: { // The markdown content
    type: String,
    default: '',
  },
  folder: { // Simple string for folder name
    type: String,
    default: null, // null represents the root directory
    index: true,
  },
  backlinks: [{ // An array of Note IDs that link to this note
    type: Schema.Types.ObjectId,
    ref: 'Note',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

NoteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Note || mongoose.model('Note', NoteSchema); 