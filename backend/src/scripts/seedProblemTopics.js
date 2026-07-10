const mongoose = require('mongoose');
require('dotenv').config();

const main = require('../config/db');
const seedProblemTopics = require('../utils/seedProblemTopics');

const run = async () => {
  try {
    await main();
    await seedProblemTopics();
    console.log('Problem topics seeded successfully.');
  } catch (err) {
    console.error('Failed to seed problem topics:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
