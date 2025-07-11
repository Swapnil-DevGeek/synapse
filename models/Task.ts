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

// Middleware to update the parent task status based on subtask completion
TaskSchema.pre('save', function (next) {
  if (this.isModified('subtasks') && this.subtasks.length > 0) {
    const allCompleted = this.subtasks.every(subtask => subtask.isCompleted);
    const anyCompleted = this.subtasks.some(subtask => subtask.isCompleted);
    
    // Auto-transition task status based on subtask completion
    if (allCompleted && this.status !== 'Done') {
      // All subtasks completed -> mark task as Done
      this.status = 'Done';
    } else if (!allCompleted && this.status === 'Done') {
      // Not all subtasks completed but task was Done -> move back to In Progress
      this.status = 'In Progress';
    } else if (anyCompleted && this.status === 'To Do') {
      // Some subtasks completed and task is still To Do -> move to In Progress
      this.status = 'In Progress';
    }
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema); 