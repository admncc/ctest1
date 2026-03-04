const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/jobs',     require('./routes/jobs'));
app.use('/api/bids',     require('./routes/bids'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Route nicht gefunden' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🔧 Handwerker-Plattform Backend läuft auf Port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
