const { Telegraf } = require('telegraf');

// Получаем переменные окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Проверяем наличие обязательных переменных
if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Ошибка: BOT_TOKEN и CHAT_ID должны быть установлены в переменных окружения Vercel');
}

// Инициализируем бота
let bot;
if (BOT_TOKEN) {
    bot = new Telegraf(BOT_TOKEN);
} else {
    console.warn('⚠️  Бот не инициализирован - нет BOT_TOKEN');
}

module.exports = async (req, res) => {
    // Устанавливаем заголовки CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Обработка preflight запросов
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Метод не разрешен. Используйте POST.'
        });
    }

    try {
        // Проверка наличия токена и chat_id
        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({
                success: false,
                error: 'Сервис не настроен. Проверьте переменные окружения на Vercel.'
            });
        }

        const { message } = req.body;

        // Валидация входных данных
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Сообщение не может быть пустым и должно быть строкой'
            });
        }

        // Отправляем сообщение в Telegram
        await bot.telegram.sendMessage(CHAT_ID, message.trim());

        console.log(`✅ Сообщение отправлено в чат ${CHAT_ID}: "${message.substring(0, 50)}..."`);

        // Успешный ответ
        return res.status(200).json({
            success: true,
            message: 'Сообщение успешно отправлено в Telegram',
            timestamp: new Date().toISOString(),
            chatId: CHAT_ID
        });

    } catch (error) {
        console.error('❌ Ошибка при отправке в Telegram:', error.message);

        // Детализация ошибок
        let statusCode = 500;
        let errorMessage = error.message;

        if (error.response) {
            errorMessage = error.response.description || error.message;
            statusCode = 400;

            // Ошибка чата (бот не добавлен, чат не существует)
            if (error.response.error_code === 400) {
                if (errorMessage.includes('chat not found') || errorMessage.includes('Chat not found')) {
                    errorMessage = 'Чат не найден. Убедитесь, что бот добавлен в чат и CHAT_ID правильный.';
                }
            }
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.response?.error_code || 'UNKNOWN_ERROR'
        });
    }
};