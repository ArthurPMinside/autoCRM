import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock data for demo
SERVICES = [
    ("ТО-1", "8 500 ₽", "1 час"),
    ("Диагностика", "3 500 ₽", "45 мин"),
    ("Замена масла", "2 500 ₽", "30 мин"),
    ("Шиномонтаж", "4 000 ₽", "1 час"),
]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("📝 Записаться на сервис", callback_data="book")],
        [InlineKeyboardButton("📋 Мои заказы", callback_data="orders")],
        [InlineKeyboardButton("💰 Прайс-лист", callback_data="price")],
        [InlineKeyboardButton("📞 Контакты", callback_data="contacts")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f"👋 Здравствуйте, {update.effective_user.first_name}!\n\n"
        "Добро пожаловать в autoCRM — запись в автосервис.\n"
        "Выберите действие:",
        reply_markup=reply_markup,
    )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if query.data == "book":
        keyboard = [
            [InlineKeyboardButton(f"{s[0]} — {s[1]}", callback_data=f"service_{i}")]
            for i, s in enumerate(SERVICES)
        ]
        keyboard.append([InlineKeyboardButton("◀ Назад", callback_data="back")])
        await query.edit_message_text(
            "📝 Выберите услугу:",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
    
    elif query.data == "orders":
        await query.edit_message_text(
            "📋 Ваши заказы:\n\n"
            "• ЗН-2024-002 — Готов (42 000 ₽)\n"
            "• ЗН-2024-003 — Ожидает (8 500 ₽)\n\n"
            "Для подробностей свяжитесь с мастером.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("◀ Назад", callback_data="back")]]),
        )
    
    elif query.data == "price":
        text = "💰 Прайс-лист:\n\n"
        for name, price, duration in SERVICES:
            text += f"• {name} — {price} ({duration})\n"
        await query.edit_message_text(
            text,
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("◀ Назад", callback_data="back")]]),
        )
    
    elif query.data == "contacts":
        await query.edit_message_text(
            "📞 Контакты:\n\n"
            "📍 Адрес: г. Москва, ул. Автосервисная, 15\n"
            "☎️ Телефон: +7 (495) 123-45-67\n"
            "🕐 Режим работы: Пн-Сб 08:00-20:00\n"
            "🌐 Сайт: autocrm.ru",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("◀ Назад", callback_data="back")]]),
        )
    
    elif query.data.startswith("service_"):
        service_idx = int(query.data.split("_")[1])
        service = SERVICES[service_idx]
        await query.edit_message_text(
            f"✅ Вы выбрали: {service[0]}\n"
            f"💰 Стоимость: {service[1]}\n"
            f"⏱ Длительность: {service[2]}\n\n"
            "📞 Для подтверждения записи позвоните: +7 (495) 123-45-67\n"
            "или оставьте заявку на сайте autocrm.ru",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📝 Записаться ещё", callback_data="book")],
                [InlineKeyboardButton("◀ Назад", callback_data="back")],
            ]),
        )
    
    elif query.data == "back":
        keyboard = [
            [InlineKeyboardButton("📝 Записаться на сервис", callback_data="book")],
            [InlineKeyboardButton("📋 Мои заказы", callback_data="orders")],
            [InlineKeyboardButton("💰 Прайс-лист", callback_data="price")],
            [InlineKeyboardButton("📞 Контакты", callback_data="contacts")],
        ]
        await query.edit_message_text(
            "Выберите действие:",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

def create_bot(token: str) -> Application:
    application = Application.builder().token(token).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    return application
