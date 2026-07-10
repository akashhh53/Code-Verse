const mongoose = require('mongoose');
const { Schema } = mongoose;

const topicSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Topic = mongoose.model('topic', topicSchema);

module.exports = Topic;
