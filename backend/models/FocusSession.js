import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference (userId) is required'],
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Session start timestamp (startedAt) is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      required: [true, 'Session duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for user focus analytics
focusSessionSchema.index({ userId: 1, startedAt: -1 });

export const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
export default FocusSession;
