import mongoose from 'mongoose';

export const PRIORITY_LEVELS = ['High', 'Medium', 'Low'];
export const CATEGORIES = ['General', 'Work', 'Personal'];

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference (userId) is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITY_LEVELS,
        message: 'Priority `{VALUE}` is not supported. Must be High, Medium, or Low',
      },
      default: 'Medium',
    },
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: 'Category `{VALUE}` is not supported. Must be General, Work, or Personal',
      },
      default: 'General',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // creates and manages createdAt and updatedAt automatically
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Helpful compound index for fast user task queries ordered by creation date
taskSchema.index({ userId: 1, createdAt: -1 });

export const Task = mongoose.model('Task', taskSchema);
export default Task;
