
// backend/src/models/Interview.js
import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Interview title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'coding', 'system-design'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: [5, 'Duration must be at least 5 minutes'],
    max: [120, 'Duration cannot exceed 120 minutes']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  questions: [{
    id: Number,
    text: String,
    type: String,
    timeLimit: Number
  }],
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  settings: {
    cameraEnabled: { type: Boolean, default: true },
    audioEnabled: { type: Boolean, default: true },
    recordingEnabled: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Calculate actual duration
interviewSchema.virtual('actualDuration').get(function() {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt - this.startedAt) / 1000 / 60); // in minutes
  }
  return null;
});

// Update user stats after interview completion
interviewSchema.post('save', async function(doc) {
  if (doc.status === 'completed') {
    const User = mongoose.model('User');
    const user = await User.findById(doc.userId);
    if (user) {
      await user.updateStats();
    }
  }
});

export default mongoose.model('Interview', interviewSchema);
