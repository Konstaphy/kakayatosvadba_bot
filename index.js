const express = require('express');
const { Telegraf } = require('telegraf');
const cors = require('cors');

const app = express();

// Для Vercel переменные окружения будут автоматически доступны
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Проверка переменных окружения
if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Ошибка: BOT_TOKEN и CHAT_ID должны быть указаны в переменных окружения Vercel');
    // Не завершаем процесс на Vercel, чтобы можно было настроить переменные
}

// Инициализация бота только если есть токен
let bot;
if (BOT_TOKEN) {
    bot = new Telegraf(BOT_TOKEN);
} else {
    console.warn('⚠️  Бот не инициализирован. Укажите BOT_TOKEN в переменных окружения Vercel');
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({
            status: 'error',
            message: 'BOT_TOKEN или CHAT_ID не настроены. Проверьте переменные окружения в Vercel.'
        });
    }

    res.json({
        status: 'ok',
        service: 'telegram-bot-api',
        timestamp: new Date().toISOString(),
        chatId: CHAT_ID
    });
});

// Основной endpoint для отправки сообщений
app.post('/api/send-message', async (req, res) => {
    try {
        // Проверка наличия токена
        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({
                success: false,
                error: 'Сервис не настроен. Проверьте переменные окружения.'
            });
        }

        const { message } = req.body;

        // Валидация
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Сообщение не может быть пустым'
            });
        }

        // Отправляем сообщение
        await bot.telegram.sendMessage(CHAT_ID, message.trim());

        console.log(`✅ Сообщение отправлено в чат ${CHAT_ID}`);

        res.json({
            success: true,
            message: 'Сообщение успешно отправлено',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка:', error.message);

        let statusCode = 500;
        let errorMessage = error.message;

        // Детализация ошибок Telegram API
        if (error.response) {
            errorMessage = error.response.description || error.message;
            statusCode = 400; // Для ошибок API Telegram
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});

// Обработка 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available: ['GET /api/health', 'POST /api/send-message']
    });
});

// Запуск бота (только если токен есть)
if (bot) {
    bot.launch().then(() => {
        console.log('🤖 Telegram бот запущен');
    }).catch(err => {
        console.error('❌ Ошибка запуска бота:', err);
    });
}

// Экспорт для Vercel
module.exports = app;

// Локальный запуск (для разработки)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на порту ${PORT}`);
        console.log(`📤 API endpoint: http://localhost:${PORT}/api/send-message`);
    });
}