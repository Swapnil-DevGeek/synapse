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
  folder: { 
    type: String,
    default: null, 
    index: true,
  },
  backlinks: [{ // An array of Note IDs that link to this note
    type: Schema.Types.ObjectId,
    ref: 'Note',
  }],
  aiConversations: [{ 
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
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