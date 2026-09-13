import mongoose from 'mongoose';

const completionHistorySchema = new mongoose.Schema(
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
      required: [true, 'Task reference (taskId) is required'],
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      required: [true, 'Completion timestamp (completedAt) is required'],
      index: true,
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

// Compound index for efficient range queries for streaks and analytics (e.g. daily/weekly completion aggregations)
completionHistorySchema.index({ userId: 1, completedAt: -1 });

export const CompletionHistory = mongoose.model('CompletionHistory', completionHistorySchema);
export default CompletionHistory;
