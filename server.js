const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const session = require('express-session');
require('dotenv').config(); // ✅ Load environment variables
console.log('Loaded OpenAI API Key:', process.env.openai_key);

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

// ✅ Use your OpenAI key from the .env file properly
const openai = new OpenAI({
    apiKey: process.env.openai_key,
});

// Configure express-session
app.use(session({
  secret: 'eduKrack-secret-key', // Replace with a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(bodyParser.json());

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  // Store the requested URL for redirect after login
  req.session.redirectTo = req.originalUrl;
  res.redirect('/public/auth.html');
};

// Routes should be checked before static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Protected routes
app.get('/public/index.html', isAuthenticated);
app.get('/public/convert.html', isAuthenticated);

// Unprotected routes (explicitly defined)
// These routes do not require authentication
app.get('/public/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/public/landingpage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landingpage.html'));
});

// Serve static files after routes are checked
app.use(express.static(path.join(__dirname, '/')));

// Helper functions for user management with JSON file
function getUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8').trim();
    if (!data) {
      // File is empty, reset to empty array
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
      return [];
    }
    try {
      return JSON.parse(data);
    } catch (err) {
      // Invalid JSON, reset to empty array
      console.error('users.json is invalid. Resetting to empty array.');
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
      return [];
    }
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function saveUsers(users) {
  try {
    // Write to a temp file first, then rename for atomicity
    const tempFile = USERS_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf8');
    fs.renameSync(tempFile, USERS_FILE);
    return true;
  } catch (error) {
    console.error('Error saving users file:', error);
    return false;
  }
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find(user => user.email === email);
}

function addUser(user) {
  const users = getUsers();
  users.push({
    ...user,
    id: Date.now().toString(),
    created_at: new Date().toISOString()
  });

  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
}


function updateUser(email, updates) {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.email === email);
  
  if (userIndex === -1) return false;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  return saveUsers(users);
}

// Initialize users file with a test user if it doesn't exist
if (!fs.existsSync(USERS_FILE) || fs.readFileSync(USERS_FILE, 'utf8') === '[]') {
  const initialUsers = [
    {
      id: '1',
      email: 'test@example.com',
      password: 'testpassword',
      created_at: new Date().toISOString()
    }
  ];
  saveUsers(initialUsers);
  console.log('Created initial user: test@example.com');
}

// Authentication endpoint - improved to handle both login and signup
app.post('/api/auth', (req, res) => {
  const { email, password, mode } = req.body;
  console.log('Auth request received:', { email, mode });
  
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  
  const user = findUserByEmail(email);
  console.log('User found:', user ? 'Yes' : 'No');
  
  if (mode === 'login') {
    // Login mode - check email and password
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found. Please sign up.' });
    }
    if (!user.password) {
      return res.status(403).json({ success: false, message: 'Please complete your signup by setting a password.' });
    }
    if (user.password === password) {
      // Set session data
      req.session.user = { email: user.email, id: user.id };
      // Get redirect URL or default to index.html
      const redirectTo = req.session.redirectTo || '/public/index.html';
      delete req.session.redirectTo;
      console.log('Login successful, redirecting to:', redirectTo);
      return res.json({ success: true, message: 'Login successful', redirectTo });
    } else {
      console.log('Invalid password provided');
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }
  } else {
    // Signup mode - check if user exists
    if (user) {
      console.log('User already exists during signup');
      return res.status(409).json({ success: false, message: 'Email already exists. Please log in or reset your password.' });
    } else {
      // Create new user with temporary status (no password yet)
      const newUser = { email };
      console.log('Creating new user:', newUser);
      if (addUser(newUser)) {
        req.session.pendingUser = { email };
        console.log('User created successfully');
        return res.status(200).json({ success: true, message: 'User created successfully' });
      } else {
        console.log('Failed to create user');
        return res.status(500).json({ success: false, message: 'Failed to create user' });
      }
    }
  }
});

// Password creation endpoint
app.post('/api/create-password', (req, res) => {
  const { email, password, confirmPassword } = req.body;
  if (!email || !password || !confirmPassword)
    return res.status(400).json({ success: false, message: 'All fields are required' });
  if (password !== confirmPassword)
    return res.status(400).json({ success: false, message: 'Passwords do not match' });

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (updateUser(email, { password })) {
    // Set session after successful password creation
    req.session.user = { email, id: user.id };
    
    // Get redirect URL or default to index.html
    const redirectTo = req.session.redirectTo || '/public/index.html';
    delete req.session.redirectTo;
    
    res.json({ success: true, message: 'Password created successfully', redirectTo });
  } else {
    res.status(500).json({ success: false, message: 'Error creating password' });
  }
});

// Logout endpoint
app.get('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error logging out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check session status
app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
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
        { role: 'system', content: 'You are EduKrack, an educational AI assistant.' },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });
      
    const reply = completion.choices[0].message.content.trim();
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    res.status(500).json({ reply: 'Sorry, I could not process your request.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
