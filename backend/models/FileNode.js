const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileNodeSchema = new Schema({
  path: { type: String, required: true, unique: true }, // /system/root/...
  name: { type: String },
  type: { type: String, enum: ['file','dir'], required: true },
  content: { type: String, default: '' }, // files only
  children: { type: [String], default: [] }, // names only
  hidden: { type: Boolean, default: false },
  mode: { type: String, default: '0644' } // for ls -l
}, { timestamps: true });

module.exports = mongoose.model('FileNode', FileNodeSchema);
