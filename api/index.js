const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
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