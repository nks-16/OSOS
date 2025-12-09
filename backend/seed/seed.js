const mongoose = require('mongoose');
const connectDB = require('../config/db');
const FileNode = require('../models/FileNode');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/os-escape';

(async () => {
  await connectDB(MONGO_URI);
  await FileNode.deleteMany({});
  const seed = JSON.parse(fs.readFileSync(__dirname + '/filesystemSeed.json','utf8'));
  for (const n of seed) {
    const node = new FileNode(n);
    await node.save();
  }
  console.log('Filesystem seeded');
  process.exit(0);
})();
