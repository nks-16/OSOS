const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const auth = require('./routes/auth');
const terminal = require('./routes/terminal');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/os-escape';
connectDB(MONGO_URI);


app.use('/api/auth', auth);
app.use('/api/terminal', terminal);

app.listen(5000, () => console.log('Server listening on 5000'));
