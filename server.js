const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const session = require('express-session');
const multer = require('multer');
const { exec } = require('child_process');
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

// Serve static files first for better file access
app.use(express.static(path.join(__dirname)));

// Routes should be after static files for this case
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Additional explicit routes for HTML files
app.get('/landingpage.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landingpage.html'));
});

app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/convert.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'convert.html'));
});

app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

app.get('/demo-video.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo-video.html'));
});

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

// Configure multer for uploads
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Director prompt — ask AI to return JSON only with fields for a safe template
const DIRECTOR_PROMPT = `
You are an Educational Video Director assistant. 
Given a user prompt, output ONLY a JSON object (no markdown, no explanations) with the following shape:
{
  "template": "bullet", // choose from preset templates: 'bullet' or 'title_and_points'
  "title": "Short title for the video",
  "bullets": ["point 1","point 2", ...] 
}
Rules:
- Output must be valid JSON only.
- Keep bullets short (max 8 items).
- Title should be concise (max 8 words).
\nUser Request: {USER_PROMPT}
`;

// New route: generate video
app.post('/api/generate-video', upload.single('slide'), async (req, res) => {
  const userMessage = (req.body.message || '').trim();
  const file = req.file; // optional uploaded slide

  if (!userMessage && !file) {
    return res.status(400).json({ success: false, message: 'Provide a message or upload a slide.' });
  }

  try {
    // 1) Ask the AI for structured variables (template, title, bullets)
    const systemPrompt = DIRECTOR_PROMPT.replace('{USER_PROMPT}', userMessage || 'Use uploaded slide to generate content');
    console.log('Requesting structured output from OpenAI...');

    let modelToUse = 'gpt-4o';
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage || 'Please summarize the uploaded slide.' }
        ],
        temperature: 0.2,
      });
    } catch (err) {
      console.warn('gpt-4o failed, falling back to gpt-3.5-turbo:', err.message || err);
      modelToUse = 'gpt-3.5-turbo';
      completion = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage || 'Please summarize the uploaded slide.' }
        ],
        temperature: 0.2,
      });
    }

    let jsonText = (completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) || '';
    // Clean code fences
    jsonText = jsonText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error('Failed to parse AI JSON response:', err, '\nResponse was:\n', jsonText);
      return res.status(500).json({ success: false, message: 'AI did not return valid JSON. See server logs.' });
    }

    // Validate minimal fields
    if (!parsed.title || !Array.isArray(parsed.bullets)) {
      return res.status(500).json({ success: false, message: 'AI returned JSON but missing required fields.' });
    }

    // 2) Build a safe Manim Python script from template using the parsed variables
    const scriptPath = path.join(__dirname, 'public', 'generated_script.py');
    const safeTitle = parsed.title.replace(/`/g, "'");
    const bullets = parsed.bullets.slice(0, 8).map(b => (b || '').replace(/`/g, "'")).map(b => b.replace(/\r?\n/g, ' '));

    const pythonTemplate = `from manim import *\n\nclass EducationalScene(Scene):\n    def construct(self):\n        title = Text(${JSON.stringify(safeTitle)}, font_size=48).to_edge(UP)\n        self.play(Write(title))\n        self.wait(0.5)\n\n        bullets = ${JSON.stringify(bullets)}\n        for i, b in enumerate(bullets):\n            txt = Text(b, font_size=28)\n            txt.to_edge(LEFT)\n            txt.shift(DOWN * (i * 0.8 + 1))\n            self.play(FadeIn(txt))\n            self.wait(0.6)\n\n        self.wait(1)\n`;

    fs.writeFileSync(scriptPath, pythonTemplate, 'utf8');
    console.log('Wrote generated script to', scriptPath);

    // 3) Render using Manim CLI (this may take time). Output to public/media/videos/generated_output.mp4
    const outputDir = path.join(__dirname, 'public', 'media', 'videos', 'generated_output');
    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    // Use manim CLI to render. The -ql flag is quick low quality to be faster. Output filename set via -o
    const manimCmd = `manim -ql ${scriptPath} EducationalScene -o ${path.join(outputDir, 'output')}`;
    console.log('Running manim command:', manimCmd);

    exec(manimCmd, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('Manim render error:', error, stderr);
        return res.status(500).json({ success: false, message: 'Video rendering failed', details: stderr });
      }

      console.log('Manim stdout:', stdout);
      // Heuristic: Manim usually writes file like output.mp4 inside media/videos/<...>/1080p60 or similar.
      // We attempted to set -o to public/media/videos/generated_output/output, manim may append quality dir. We'll search for the generated mp4.
      const possiblePaths = [
        path.join(outputDir, 'output.mp4'),
        path.join(outputDir, 'output', '1080p60', 'output.mp4'),
        path.join(outputDir, 'output', '720p30', 'output.mp4'),
        path.join(__dirname, 'media', 'videos', 'generated_output', 'output.mp4'),
      ];

      // Try common location first
      let found = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) { found = p; break; }
      }

      if (!found) {
        // Try to locate newest mp4 under the outputDir
        const walk = (dir) => fs.readdirSync(dir).flatMap(f => {
          const full = path.join(dir, f);
          return fs.statSync(full).isDirectory() ? walk(full) : [full];
        });
        const allFiles = walk(outputDir).filter(f => f.endsWith('.mp4'));
        if (allFiles.length > 0) {
          // pick the most recently modified
          allFiles.sort((a,b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
          found = allFiles[0];
        }
      }

      if (!found) {
        console.error('Could not find generated MP4 under', outputDir);
        return res.status(500).json({ success: false, message: 'Rendered video produced no mp4 file' });
      }

      // Build a public URL relative to server static root (we serve static from project root)
      const publicPath = found.replace(path.join(__dirname, 'public'), '');
      const videoUrl = publicPath.startsWith('/') ? publicPath : '/' + publicPath;

      console.log('Video available at', videoUrl);
      res.json({ success: true, message: 'Video generated', videoUrl });
    });

  } catch (error) {
    console.error('generate-video error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
