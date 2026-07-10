const Topic = require('../models/topic');
const { problemTopics } = require('../constants/problemMeta');

const seedProblemTopics = async () => {
  const operations = problemTopics.map((topic, index) => ({
    updateOne: {
      filter: { key: topic.value },
      update: {
        $set: {
          key: topic.value,
          label: topic.label,
          order: index,
        },
      },
      upsert: true,
    },
  }));

  if (!operations.length) return;

  await Topic.bulkWrite(operations);
};

module.exports = seedProblemTopics;
