import mongoose, { Schema } from 'mongoose';

const SubtaskSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const TaskSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Indexed for fast querying
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    index: true,
  },
  dueDate: {
    type: Date,
    index: true,
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do',
    index: true,
  },
  subtasks: [SubtaskSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the parent task status when all subtasks are complete
TaskSchema.pre('save', function (next) {
  if (this.isModified('subtasks')) {
    const allCompleted = this.subtasks.every(subtask => subtask.isCompleted);
    if (this.subtasks.length > 0 && allCompleted) {
      this.status = 'Done';
    }
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema); 