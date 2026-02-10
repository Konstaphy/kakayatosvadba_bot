const express = require('express');
const cors = require('cors');

const app = express();
const sendMessageHandler = require('./send-message');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/send-message', sendMessageHandler);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Telegram Bot API',
        endpoints: {
            health: 'GET /api/health',
            sendMessage: 'POST /api/send-message'
        }
    });
});

// Экспорт для Vercel
module.exports = app;