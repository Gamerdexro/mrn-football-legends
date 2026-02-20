require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/mrnbackend';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_prod';

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  score: { type: Number, default: 0 }
});

const matchSchema = new mongoose.Schema({
  players: [String],
  result: Object,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Match = mongoose.model('Match', matchSchema);

function generateToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth token' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Malformed auth header' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Simple input validation helpers
function validUsername(u) { return typeof u === 'string' && u.length >= 3 && u.length <= 30; }
function validPassword(p) { return typeof p === 'string' && p.length >= 6; }

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!validUsername(username) || !validPassword(password)) return res.status(400).json({ error: 'Invalid input' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username taken' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ username, passwordHash });
    await user.save();
    const token = generateToken(user);
    return res.json({ token, username: user.username, score: user.score });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!validUsername(username) || !validPassword(password)) return res.status(400).json({ error: 'Invalid input' });
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = generateToken(user);
    return res.json({ token, username: user.username, score: user.score });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Example protected route: submit match result
app.post('/match', authMiddleware, async (req, res) => {
  try {
    // Do NOT trust client-side score. Accept raw match data and compute server-side if possible.
    const { players, result } = req.body;
    if (!Array.isArray(players) || players.length === 0) return res.status(400).json({ error: 'Invalid players' });
    const match = new Match({ players, result });
    await match.save();
    return res.json({ ok: true, matchId: match._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Protected example: update score server-side
app.post('/score/update', authMiddleware, async (req, res) => {
  try {
    const { scoreDelta } = req.body;
    if (typeof scoreDelta !== 'number') return res.status(400).json({ error: 'Invalid input' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Server-side control: apply delta with limits
    const delta = Math.max(Math.min(scoreDelta, 1000), -1000);
    user.score = Math.max(0, user.score + delta);
    await user.save();
    return res.json({ ok: true, score: user.score });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username score createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
