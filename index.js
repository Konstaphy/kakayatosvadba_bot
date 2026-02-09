const express = require('express');
const { Telegraf } = require('telegraf');
const bodyParser = require('body-parser');
const cors = require('cors'); // Если фронт на другом домене
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Проверка переменных окружения
if (!BOT_TOKEN) {
    console.error('Ошибка: BOT_TOKEN должен быть указан в .env файле');
    process.exit(1);
}

if (!CHAT_ID) {
    console.error('Ошибка: CHAT_ID должен быть указан в .env файле');
    process.exit(1);
}

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Middleware
app.use(cors()); // Разрешаем запросы с других доменов
app.use(bodyParser.json());

// Маршрут для отправки сообщения в Telegram
app.post('/api/send-message', async (req, res) => {
    try {
        const { message } = req.body;

        // Валидация
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Сообщение не может быть пустым'
            });
        }

        // Отправляем сообщение в указанный чат
        await bot.telegram.sendMessage(CHAT_ID, message.trim());

        console.log(`Сообщение отправлено в чат ${CHAT_ID}: ${message}`);

        res.json({
            success: true,
            message: 'Сообщение успешно отправлено в Telegram',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Ошибка при отправке сообщения в Telegram:', error);

        // Более детальные ошибки для отладки
        let errorMessage = error.message;
        if (error.response) {
            errorMessage = `Telegram API error: ${error.response.description || error.message}`;
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});

// Проверка соединения с ботом
app.get('/api/health', async (req, res) => {
    try {
        // Проверяем, что бот работает
        const botInfo = await bot.telegram.getMe();

        res.json({
            status: 'ok',
            bot: {
                username: botInfo.username,
                first_name: botInfo.first_name,
                is_bot: botInfo.is_bot
            },
            chatId: CHAT_ID,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Обработка ошибок 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Запуск бота и сервера
async function start() {
    try {
        // Запускаем бота
        await bot.launch();
        console.log('🤖 Telegram бот запущен');
        console.log(`📝 ID чата для отправки: ${CHAT_ID}`);

        // Запускаем сервер
        app.listen(PORT, () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`📤 API endpoint: http://localhost:${PORT}/api/send-message`);
        });

        // Graceful shutdown
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

start();