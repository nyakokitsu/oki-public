import { Markup } from "telegraf";

function help(ctx: any) {
    ctx.reply("<a href='https://telegra.ph/Oki-Help-RU-01-21'>🇷🇺: смотрите все команды бота тут</a>\n<a href='https://telegra.ph/Oki-Help-EN-01-21'>🇬🇧: see here all bot commands</a>\n<a href='https://telegra.ph/Oki-Help-UA-01-22'>🇺🇦: дивіться всі команди бота тут</a>", {
        parse_mode: "HTML",
        disable_web_page_preview: true
    })
}

export {
    help
}
