const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config(); // ✅ Load environment variables
console.log('Loaded OpenAI API Key:', process.env.openai_key);


const app = express();
const PORT = 3000;

// ✅ Use your OpenAI key from the .env file properly
const openai = new OpenAI({
    apiKey: process.env.openai_key,
  });

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set the about page as the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// SQLite setup (same as before)
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    confirm_password TEXT
  )`);
  db.run(`INSERT INTO users (email) VALUES ('test@example.com')`);
});

// Authentication (same)
app.post('/api/auth', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (row) return res.json({ success: true, message: 'Authentication successful' });
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  });
});

// Password creation (same)
app.post('/api/create-password', (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword)
    return res.status(400).json({ success: false, message: 'All fields are required' });
  if (password !== confirmPassword)
    return res.status(400).json({ success: false, message: 'Passwords do not match' });

  db.run(
    'UPDATE users SET password = ?, confirm_password = ? WHERE email = ?',
    [password, confirmPassword, email],
    function (err) {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (this.changes === 0)
        return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, message: 'Password created successfully' });
    }
  );
});

// ✅ GPT Integration Endpoint (Fixed)
app.post('/api/generate-reply', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: 'Message is required' });

  try {
    console.log('Incoming message:', message);

    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are EduKrack...' },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
      });
      

      const reply = completion.choices[0].message.content.trim();
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    res.status(500).json({ reply: 'Sorry, I couldn’t process your request.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
