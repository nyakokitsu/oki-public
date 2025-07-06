import { Markup } from 'telegraf';
import * as beatmap from './controllers/map';
import * as user from './controllers/user'
require('dotenv').config({ path: './.env' });
import { autoQuote } from "@roziscoding/grammy-autoquote";
import * as lastUse from "./utils/db"
import * as replays from "./controllers/replays"
//const ufs = require("url-file-size");
import * as text from './controllers/textCommands'
import * as account from './utils/account'
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
import {User} from "./db/models/user"
import * as settings from './controllers/settings'
import {fetchScoreById, fetchBmByStarrate, fetchRecentScore, fetchBestScore, fetchUserInfo, fetchRecentScores, fetchBestScores} from './utils/osuAPIv2';
import { score } from './utils/gatari';
import axios from 'axios';
import { extractAudio } from './utils/audio';
import { autoRetry } from "@grammyjs/auto-retry";
import { Bot, InputFile, Context, InlineKeyboard, Keyboard, session, GrammyError, HttpError } from "grammy";
import {FileAdapter} from '@grammyjs/storage-file';
import {isOsuBeatmapSetUrl, isOsuBeatmapUrl, getBeatmapIdFromUrl, getBeatmapSetIdFromUrl, isOsuUserUrl, getUserIdFromUrl, isCommand, getCommandFromMessage} from './utils/middleware'
import type {MyContext, Session} from './context';
import { connectAndRunIRC } from './controllers/irc';
import { createInvoice } from './controllers/donate';
import {
        conversations,
        createConversation,
      } from "@grammyjs/conversations";
import { ignoreOld } from "grammy-middlewares";
import { limit } from "@grammyjs/ratelimiter";
import { emojiParser } from "@grammyjs/emoji";
import { getFlagEmoji } from './utils/utils';
import LabeledPrice from '@grammyjs/types'
import { scoresCard } from './utils/cards';


mongoose.connect(process.env.mongoConnection);

const bot = new Bot<MyContext>(process.env.tgTOKEN)
const hello_stikers = ["CAACAgEAAxkBAAEI-QlkYBBIJN2FP4rFVSGqhz2WMNWd1QACrwcAAg6_0Ao54hzm578voS8E", "CAACAgEAAxkBAAEI-QtkYBBqht9G3hAxYWDrxyjyV-XJTAACzwcAAg6_0ArA6Jqrq6ZloC8E", "CAACAgEAAxkBAAEI-Q1kYBBtfHvXLjJXUNp0INC6JN9i6QACywcAAg6_0ApnjE-LBlyWpS8E", "CAACAgIAAxkBAAEI-Q9kYBCo4Bg0cDq_HcVnPWF-a4673AACeAADOdV0Gw4-kBRAcaPFLwQ"]


bot.use(autoQuote());
bot.use(session({
	initial: (): Session => ({})
}));

// Skip updates
bot.use(ignoreOld(600))

// Queue plugin
bot.api.config.use(autoRetry());

// Conversations
bot.use(conversations());
bot.use(createConversation(settings.skinChangeDialog, "skin-dialog"));

// Emoji
bot.use(emojiParser());

// RateLimiter
/*bot.use(
        limit({
          // Allow only 5 messages to be handled every 10 seconds.
          timeFrame: 10000,
          limit: 5,
          onLimitExceeded: async (ctx) => {
            await ctx.reply("❌ | Погодите, не так быстро!");
          }
        })
      );
*/

bot.callbackQuery(/audio_(\d+)/, async (ctx) => {
  ctx.answerCallbackQuery();
  const message_id = ctx.callbackQuery.message.message_id;
  const chat_id = ctx.callbackQuery.message.chat.id;

  ctx.api.editMessageReplyMarkup(chat_id, message_id);
  ctx.replyWithChatAction("record_voice");

  const audioId = ctx.match[1];
  const audio = await extractAudio(audioId);

  if (!audio.file) {
    ctx.reply("❌ | Аудио недоступно", { reply_to_message_id: message_id });
    return;
  }

  const audioBuffer = await audio.file;
  const performer = audio.metadata.performer;
  const title = audio.metadata.title;
  const thumbUrl = `https://api.nerinyan.moe/bg/${audioId}`;
  const caption = ctx.chat.type !== "private"
    ? `Запрошено: *[${ctx.callbackQuery.from.first_name}](tg://user?id=${ctx.callbackQuery.from.id})*`
    : "";

  ctx.replyWithAudio(
    new InputFile(audioBuffer),
    {
      performer,
      title,
      thumbnail: new InputFile(new URL(thumbUrl)),
      reply_to_message_id: message_id,
      caption,
      parse_mode: "MarkdownV2",
    }
  );
});

//https://oki-testnet.nyako.tk/
bot.callbackQuery(/skinchoose/, (ctx, next) => {
	ctx.answerCallbackQuery();
        ctx.reply(
		"Выберите скин, нажав на кнопку ниже.",
		{
                        reply_markup: new Keyboard().webApp("Выбрать скин", "https://oki-testnet.nyako.tk/")
				   .row()
				   .text("Отмена")
				   .resized()
                }
	);

});


bot.callbackQuery(/sip_(\d+)/, async (ctx, next) => {
        const user = await User.findOne({tgId: ctx.callbackQuery.from.id})
        if (!(user && user.settings.rendering.hiRes)) {
                ctx.answerCallbackQuery({text: "❌ | у вас нет оки!саппортера, для того чтобы посмотреть турнирую статистику\nhttps://t.me/okisupporter", show_alert: true})
                return;
        } 
        const { data } = await axios.get(`https://skillissue.app/ratings/${ctx.match[1]}`, {headers: {'source': 'TOKENREMOVED'}})
        if (data.rating) {
                const flag = getFlagEmoji(data.countryCode.toLowerCase())
                const msg =  `<u>турнирная статистика юзера</u>
\n<b>Глобальная</b>
<blockquote expandable><i>SIP:</i> <b>${data.rating.value}</b>
<i>Ранк(глобал):</i> <b>${data.rating.globalRank}</b>
<i>Ранк(${flag}):</i> <b>${data.rating.countryRank}</b>
<i>pp:</i> <b>${data.rating.pp}</b>
\n</blockquote>
\nМоды
<b>NoMod</b>
<blockquote expandable><i>SIP:</i> <b>${data.modifications.NoMod.value}</b>
<i>Ранк(глобал):</i> <b>${data.modifications.NoMod.globalRank}</b>
<i>Ранк(${flag}):</i> <b>${data.modifications.NoMod.countryRank}</b>
<i>pp:</i> <b>${data.modifications.NoMod.pp}</b>
\n</blockquote>
<b>Hidden</b>
<blockquote expandable><i>SIP:</i> <b>${data.modifications.Hidden.value}</b>
<i>Ранк(глобал):</i> <b>${data.modifications.Hidden.globalRank}</b>
<i>Ранк(${flag}):</i> <b>${data.modifications.Hidden.countryRank}</b>
<i>pp:</i> <b>${data.modifications.Hidden.pp}</b>
\n</blockquote>
<b>Hard Rock</b>
<blockquote expandable><i>SIP:</i> <b>${data.modifications["Hard Rock"].value}</b>
<i>Ранк(глобал):</i> <b>${data.modifications["Hard Rock"].globalRank}</b>
<i>Ранк(${flag}):</i> <b>${data.modifications["Hard Rock"].countryRank}</b>
<i>pp:</i> <b>${data.modifications["Hard Rock"].pp}</b>
\n</blockquote>
<b>Double Time</b>
<blockquote expandable><i>SIP:</i> <b>${data.modifications["Double Time"].value}</b>
<i>Ранк(глобал):</i> <b>${data.modifications["Double Time"].globalRank}</b>
<i>Ранк(${flag}):</i> <b>${data.modifications["Double Time"].countryRank}</b>
<i>pp:</i> <b>${data.modifications["Double Time"].pp}</b>
\n</blockquote>`
                ctx.reply(msg, {'parse_mode': 'HTML'})
                ctx.answerCallbackQuery();
        } else {
                ctx.answerCallbackQuery({text: "❌ | у этого пользователя нет турнирной статистики =(\nможет ему стоит сходить на турнир?", show_alert: true});
        }
});


bot.callbackQuery(/set_(.+)_(.+)/, (ctx, next) => {
	ctx.answerCallbackQuery();
        //ctx.telegram.sendMessage(ctx.callbackQuery.message.chat.id, `${ctx.match[1]} -- ${Boolean(ctx.match[2])}`)
        settings.set(ctx, ctx.match[1], ctx.match[2], User)

});

bot.callbackQuery(/settingcategory_(.+)/, (ctx, next) => {
	ctx.answerCallbackQuery();
        settings.category(ctx, ctx.match[1])
	

});

bot.callbackQuery(/settingsmenu/, (ctx, next) => {
	ctx.answerCallbackQuery();
        settings.start(ctx)
	

});


bot.callbackQuery(/settingchoosing_(.+)/, (ctx, next) => {
	ctx.answerCallbackQuery();
        //console.log(ctx)
        settings.choose(ctx, ctx.match[1], User)
	

});
bot.callbackQuery(/score_(\d+)_(.+)_(\d+)_(\d+)/, async (ctx, next) => {
	ctx.answerCallbackQuery();
        const msgid = ctx.callbackQuery.message.message_id
        const chatid = ctx.callbackQuery.message.chat.id
        ctx.api.deleteMessage(chatid, msgid);
        var scoreElement;
        if (ctx.match[2] == "true") {
                scoreElement = (await fetchRecentScores(ctx.match[3]))
        } else {
                scoreElement = (await fetchBestScores(ctx.match[3]))
        }
        scoreElement = scoreElement[ctx.match[1]]

        const count300 = scoreElement.statistics.great ? scoreElement.statistics.great : 0
	const count100 = scoreElement.statistics.ok ? scoreElement.statistics.ok : 0
	const count50 = scoreElement.statistics.meh ? scoreElement.statistics.meh : 0
	const miss = scoreElement.statistics.miss ? scoreElement.statistics.miss : 0

	var mods = []
        
	if (scoreElement["mods"]) {
	 for (let i = 0; i < scoreElement["mods"].length; ++i) {
		mods.push(scoreElement["mods"][i]["acronym"])
		
	 }
	}
	
	ctx.reply(`Инфо о<a href="${scoreElement.beatmapset.covers["cover@2x"]}"> </a>скоре:\n\nНа <code>${scoreElement.beatmap.status}</code> карте <b><a href="https://osu.ppy.sh/s/${scoreElement.beatmapset.id}">${scoreElement.beatmapset.title_unicode}</a></b> от <a href="https://osu.ppy.sh/users/${scoreElement.beatmapset.user_id}">${scoreElement.beatmapset.creator}</a> на сложности <a href="https://osu.ppy.sh/b/${scoreElement.beatmap.id}">${scoreElement.beatmap.version}</a>\n<b><u>Попадания:</u></b>\n<i>300</i>: <b>${count300}</b>\n<i>100</i>: <b>${count100}</b>\n<i>50</i>: <b>${count50}</b>\n❌: <b>${miss}</b>\nПройдено на ранк <b>${scoreElement.rank}</b> с точностью <u>${Math.floor(scoreElement.accuracy * 1000) / 10}%</u>${mods.length != 0 ? " +" + mods.join("") : "" }${scoreElement.pp != null ? "\nЗаработано <b>"+Math.round(scoreElement.pp)+"</b>pp": "\n<b>pp не заработано</b>"}\nКарта пройдена ${scoreElement.passed ? "" : "не "}полностью`, {parse_mode: 'HTML', reply_parameters: { message_id: Number(ctx.match[4]) }, ...Markup.inlineKeyboard([
                [Markup.button.callback("🔗 | юзер", `user_${scoreElement.user.id}`)],
                [Markup.button.callback("🔗 | диффа", `bm_${scoreElement.beatmap.id}`)],
        ])
})
});

bot.callbackQuery(/bmset_(\d+)/, (ctx, next) => {
	ctx.answerCallbackQuery();
        beatmap.getBeatmapsetData(ctx, ctx.match[1], undefined)

});

bot.callbackQuery("donate_cryptobot", (ctx, next) => {
	ctx.answerCallbackQuery();

        ctx.reply("Вы уверены что хотите продолжить?", {
                reply_markup: new InlineKeyboard().text("Да", "crypto_start").text("Нет", "cancel")
        })

});

bot.callbackQuery("crypto_start", async (ctx, next) => {
	ctx.answerCallbackQuery();
        const invoice = await createInvoice(ctx.from.id)
        ctx.reply("Оплатите счет ниже в течении часа", {reply_markup: new InlineKeyboard().url("Оплатить", invoice.bot_invoice_url)})

});

bot.callbackQuery(/bm_(\d+)/, (ctx, next) => {
	ctx.answerCallbackQuery();
        beatmap.getBeatmapData(ctx, ctx.match[1])


});


bot.callbackQuery(/user_(\d+)/, async (ctx, next) => {
	ctx.answerCallbackQuery();
        const caller = await User.findOne({tgId: ctx.callbackQuery.from.id}) 
                        if (caller === null) {
                                ctx.reply(`❌ | аккаунт ${ctx.callbackQuery.from.first_name} не привязан.\nпривяжите его командой osu!link`, {reply_to_message_id: ctx.callbackQuery.message.message_id})
                        } else {
        user.requestDataById(ctx, ctx.match[1]) 
        }
})

bot.callbackQuery(/nick_([a-zA-Z0-9 _]+)/, async (ctx, next) => {
	ctx.answerCallbackQuery();
        const caller = await User.findOne({tgId: ctx.callbackQuery.from.id}) 
                        if (caller === null) {
                                ctx.reply(`❌ | аккаунт ${ctx.callbackQuery.from.first_name} не привязан.\nпривяжите его командой osu!link`, {reply_to_message_id: ctx.callbackQuery.message.message_id})
                        } else {
                                
                                user.requestData( ctx, ctx.match[1])
        }
})

const processTournament = async (ctx) => {
        const caller = await User.findOne({tgId: ctx.from.id})
              if (!caller) {
                ctx.reply('❌ | вам необходимо привязать аккаунт\nиcпользуйте osu!link');
                return;
              }
              
              const { data } = await axios.get(`https://skillissue.app/ratings/${caller.osuId}`, { headers: { source: 'TOKENREMOVED' } });
              
              const rating = data.rating;
              const rank = (await fetchUserInfo(caller.osuId)).statistics.global_rank
              const sipCondition = rating ? rating.value < 6000 : true;
              const rankCondition = 10000 < rank && rank < 100000;
              const inlineKeyboard = new InlineKeyboard()
                        .text("Зарегистрироваться", "register_tournament")
              
              ctx.reply(`Регистрация на турнир\n\nУсловия:\nSIP: ${sipCondition ? '✅ Вы подходите' : '❌ Вы не подходите'}\nРанг: ${rankCondition ? '✅ Вы подходите' : '❌ Вы не подходите'}`, {reply_markup: sipCondition && rankCondition ? inlineKeyboard : null});
        
}
/*
bot.command('tournament', async (ctx) => {
              await processTournament(ctx)
        
})*/

bot.callbackQuery("register_tournament", async (ctx, next) => {
        const msgid = ctx.callbackQuery.message.message_id
        const chatid = ctx.callbackQuery.message.chat.id
        ctx.api.editMessageReplyMarkup(chatid, msgid);
        let wait = ctx.reply("⏳")
        const caller = await User.findOne({tgId: ctx.callbackQuery.from.id})
        const username = ctx.from.username ? ctx.callbackQuery.from.username : ctx.callbackQuery.from.id
        const res = await axios.post(`${process.env.TR_API}/register`, {
                idOsu: caller.osuId,
                tgId: username.toString()
        }, {
                headers: {
                        "Content-Type": "application/json"
                }
        })
        await ctx.answerCallbackQuery()
        await ctx.api.deleteMessage((await wait).chat.id, (await wait).message_id)
        if ((Date.now() / 1000 - 1720688400) >= 0 ) {
                ctx.reply('❌ | регистрация больше недоступна')
                return;
        }

        if (res.data.detail.resId == 0) {
                ctx.reply(`✅ Вы успешно зарегистрировались на оки!турнир\nсписок участников <a href="https://docs.google.com/spreadsheets/d/1BdJV6-On6IK1lW44jFvtZJqIjIsqbg8ateIWp3HGlTk/edit?gid=0#gid=0">можно посмотреть тут</a>`, {parse_mode: "HTML", link_preview_options: {is_disabled: true}})
        } else if (res.data.detail.resId == 1) {
                ctx.reply("❌ | вы уже зарегистрировались на турнир.")
        } else if (res.data.detail.resId == 2) {
                ctx.reply("❌ | регистрация в этом регионе недоступна")
        }
})



bot.callbackQuery(/help/, (ctx, next) => {
	ctx.answerCallbackQuery();
	//ctx.telegram.deleteMessage(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id)
	text.help(ctx)
});

bot.command('start', async (ctx) => {
        if (ctx.chat.type == 'private'){
        
                if (ctx.update.message.text.split(' ')[1]) {
                        if (ctx.update.message.text.split(' ')[1].startsWith("link")) {
                                ctx.reply("➕ | ваш osu! профиль привязан")
                        } else if (ctx.update.message.text.split(' ')[1].startsWith("settings")) {
				settings.start(ctx)
                        }else if (ctx.update.message.text.split(' ')[1].startsWith("supporter")) {
				supporter(ctx)
                        } else if (ctx.update.message.text.split(' ')[1].startsWith("accountlink")) {
				if (ctx.message.chat.type != "private") {
                        ctx.reply("🤓 | Простите сэр, но авторизация доступна только в личных сообщениях с ботом.")
                } else {
                const user = await User.findOne({tgId: ctx.message.from.id})
                if (user) {
                        ctx.reply("❌ | аккаунт уже привязан.")
                } else {
                        const link = account.genAuthLink(ctx.message.from.id)
                ctx.reply("привязать аккаунт", {
                        ...Markup.inlineKeyboard([
                                [Markup.button.url("➕ | привязать osu", link.osu)],
                                //[Markup.button.url("➕ | привязать lisek", link.lisek)]
                        ]),
                })
                }
                }
                        } else if (ctx.update.message.text.split(' ')[1] == "successlink") {
                                ctx.reply("➕ | ваш osu! профиль привязан")
                        } else if (ctx.update.message.text.split(' ')[1] == "successrelink") {
                                ctx.reply("➕ | ваш osu! профиль перепривязан")
                        } else if (ctx.update.message.text.split(' ')[1].startsWith("profile_")) {
                                user.requestDataById(ctx, ctx.update.message.text.split(' ')[1].replace("profile_", ""))
                        }
                } else {

        
        ctx.replyWithSticker(hello_stikers[Math.floor(Math.random()*hello_stikers.length)])
        ctx.reply("привет!", {

                ...Markup.inlineKeyboard([
                        [Markup.button.url("➕ | добавить в группу", "https://t.me/okichanbot?startgroup=true"),
                ],[
                        Markup.button.url("❤️ | oki!supporter", "https://t.me/okisupporter"),

                        Markup.button.callback("❓ | помощь", "help")
                ]
                ])


        })
        }
        
        } else {
                ctx.reply("привет! буду скидывать в эту группу некоторую информацию про osu!", {

                ...Markup.inlineKeyboard([
                        [Markup.button.url("➕ | добавить в свою группу", "https://t.me/okichanbot?startgroup=true"),
                ],[
                        Markup.button.url("❤️ | oki!supporter", "https://t.me/okisupporter"),
                ]
                ])
                

        })

        }
})


bot.on(':document', async (ctx) => {
    if (ctx.message.document.file_name && ctx.message.document.file_name.endsWith(".osr")) {  
        if (JSON.parse(JSON.stringify(ctx.message)).media_group_id !== undefined) {
          ctx.reply("❌ | Отправьте только один файл, пожалуйста");
          return;
        }
      
        const user = await User.findOne({ tgId: ctx.message.from.id });
        if (!user) {
          ctx.reply("❌ | Для рендера вам необходимо пройти процесс привязки к osu!");
          return;
        }
      
        const lastUsageTs = lastUse.getLastCommandTime(ctx.message.from.id.toString());
        if (await lastUsageTs) {
          const time = (Date.now() / 1000) -  5 * 60;
          if (await lastUsageTs < time) {
                        await lastUse.updateCommandTime(ctx.message.from.id.toString())
                        await processFile(ctx, user);
                } else {
                        ctx.reply(`❌ | Вам необходимо подождать 5 минут перед генерацией следующего видео.`, { parse_mode: "HTML" });
                }
        } else {
                        await lastUse.updateCommandTime(ctx.message.from.id.toString())
                        await processFile(ctx, user);
        }
      }
      });
      
      async function processFile(ctx: Context, user) {
        const fileId = ctx.message.document.file_id;
        const file = await ctx.getFile();
        if (ctx.message.from.id !== 5392405302) {
          lastUse.updateCommandTime(ctx.message.from.id.toString());
        }
        replays.genVideo(ctx, User, `https://api.telegram.org/file/bot${process.env.tgTOKEN}/${file.file_path}`);
      }



const welcomeMessage = (ctx, message) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url("➕ | добавить в свою группу", "https://t.me/окichanbot?startgroup=true")],
    [Markup.button.url("❤️ | support", "https://t.me/donatenyako")]
  ]);

  ctx.reply(message, { ...keyboard });
};

bot.on('message:supergroup_chat_created', (ctx) => {
  welcomeMessage(ctx, "привет! буду скидывать в эту группу некоторую информацию про osu!");
});

bot.on('message:group_chat_created', (ctx) => {
  welcomeMessage(ctx, "привет! я полезный бот для игроков osu!");
});

bot.command('supporter', async (ctx) => supporter(ctx))

async function supporter(ctx)  {
        if (ctx.chat.type != 'private') {
                ctx.reply('❌ | оплатить oki!supporter можно только в лс бота.')
        } else {
                const data = await User.findOne({tgId: ctx.message.from.id})
                if (data) {
                        if (!data.settings.rendering.hiRes) {
                                ctx.replyWithInvoice(
                                        "oki!supporter",
                                        "donate to nyakodev",
                                        ctx.from.id.toString(),
                                        "XTR",
                                        [{label: "donate", amount: 25}],
                                        {
                                                photo_url: "https://files.catbox.moe/8ioxad.jpg"
                                        }
                                )
                        } else {
                                ctx.reply(`Упс! Кажется у вас уже есть oki!supporter. Если хотите задонатить еще, то пожалуйста возпользуйтесь методами описанными <a href="https://t.me/donatenyako">тут</a>`, {'parse_mode': "HTML"})
                        }
                        
                } else {
                        ctx.reply('❌ | ваш аккаунт должен быть привязан к osu!')
                }
        }
        
}

bot.on("pre_checkout_query", (ctx) => {
        ctx.answerPreCheckoutQuery(true)
})

bot.on("message:successful_payment", async (ctx) => {
        const data = await User.findOne({tgId: ctx.message.from.id})
        if (data.settings.rendering.hiRes) {
                ctx.refundStarPayment()
                ctx.reply(`Упс! Кажется у вас уже есть oki!supporter. Мы вернули вам ваши звезды, если хотите задонатить еще, то пожалуйста возпользуйтесь методами описанными <a href="https://t.me/donatenyako">тут</a>`, {'parse_mode': 'HTML'})
        } else {
                await User.findOneAndUpdate({ tgId: ctx.from.id }, { "settings.rendering.hiRes": true });
                ctx.reply(`<i>Спасибо за поддержку <b>Oki-Chan</b>!</i> \nВам успешно выдан oki!supporter. \n\nЕсли вы перевели средства по ошибке, то можете запросить рефанд у @Anaka3. \nДля этого вам необходим id платежа: <pre>${ctx.update.message.successful_payment.telegram_payment_charge_id}</pre>`, {'parse_mode': 'HTML'})
                //ctx.refundStarPayment()
        }
})

bot.catch((err) => {
        const ctx = err.ctx;
        if (ctx.update.pre_checkout_query) {
                ctx.answerPreCheckoutQuery(true)
        } else {
                console.error(`Error while handling update ${ctx.update.update_id}:`);
                const e = err.error;
                if (e instanceof GrammyError) {
                        console.error("Error in request:", e.description);
                } else if (e instanceof HttpError) {
                        console.error("Could not contact Telegram:", e);
                } else {
                        console.error("Unknown error:", e);
                }
        }
})

/*bot.command('donate', (ctx) => {
        const kb = new InlineKeyboard()
            .text("Crypto", "donate_cryptobot").row()
            .url("Other", "https://t.me/donatenyako/9")
        ctx.reply("<b>Внимание!</b> В настоящий момент автопокупка oki!supporter доступна <b>только</b> через CryptoBot, при оплате через юмани все также нужно писать в <a href='https://t.me/Anaka3'>мне в лс</a>", {reply_markup: kb, parse_mode: 'HTML'})

})*/
// shit code at 3pm moment
function randomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


bot.hears("Отмена", async (ctx) => {
	ctx.reply("ℹ️ | действие отменено", {reply_markup: { remove_keyboard: true }})
})
bot.on("message:web_app_data", async (ctx) => {
        if (ctx.message.web_app_data.data.startsWith("dl_")) {
                axios.get(`https://dl.issou.best/ordr/skins/${ctx.message.web_app_data.data.replace("dl_", "")}.osk`,{ responseType: 'arraybuffer'})
                        .then((res) => {
                                try{
                                        ctx.replyWithDocument(new InputFile(res.data, "skin.osk"))
                                } catch {
                                        ctx.reply(`ℹ️ | Файл слишком большой! Скачайте его [по ссылке](https://dl.issou.best/ordr/skins/${ctx.message.web_app_data.data.replace("dl_", "")}.osk)`, {parse_mode: "Markdown"})
                                }
                                
                        })
                
        } else if (ctx.message.web_app_data.data.startsWith("renderChoose_")) {
                const data = await User.findOneAndUpdate({tgId: ctx.message.from.id}, { "settings.rendering.skin": ctx.message.web_app_data.data.replace("renderChoose_", "") })
                ctx.reply("ℹ️ | скин для рендера обновлен!", {reply_markup: { remove_keyboard: true }})

        }
})


/* TODO: rewrite
bot.on("message:text", async (ctx) => {
        const messageText = ctx.message?.text;
      
        if (isOsuBeatmapUrl(messageText)) {
          const beatmapId = getBeatmapIdFromUrl(messageText);
          const beatmapSetId = getBeatmapSetIdFromUrl(messageText);
          beatmap.getBeatmapsetData(ctx, beatmapSetId, beatmapId);
        } else if (isOsuUserUrl(messageText)) {
          const userId = getUserIdFromUrl(messageText);
          user.requestDataById(ctx, userId);
        } else if (isCommand(messageText)) {
          const command = getCommandFromMessage(messageText);
          switch (command) {
            case "help":
              text.help(ctx);
              break;
            case "settings":
              const userData = await User.findOne({ tgId: ctx.message.from.id });
              if (userData === null) {
                ctx.reply("🤓 | Простите сэр, но настройки доступны только авторизованым людям.\nАвторизоваться можно командой osu!link.");
              } else {
                settings.start(ctx);
              }
              break;
            case "rnd":
              axios.get(`https://catboy.best/api/search?query=&mode=0&offset=${Math.floor(Math.random() * 27957)}&status=1&amount=1`)
                .then((res) => {
                  beatmap.getBeatmapsetData(ctx, res.data[0].SetID, undefined);
                });
              break;
            case "db":
              ctx.reply(
                "списки",
                {reply_markup: new InlineKeyboard().webApp("Бейджи", "https://oki.nyako.tk/badges")}
              );
              break;
            case "me":
              const userDataMe = await User.findOne({ tgId: ctx.message.from.id });
              if (userDataMe === null) {
                ctx.reply("❌ | аккаунт не привязан.\nпривяжите его командой osu!link");
              } else {
                user.requestData(ctx, userDataMe.osuId, {
                  type: 0
                });
              }
              break;
            case "last":
                let userDataLast;
                let replied = ctx.message?.reply_to_message
                if (replied) {
                        userDataLast = await User.findOne({ tgId: replied.from?.id });
                } else {
                        userDataLast =  await User.findOne({ tgId: ctx.message?.from?.id });
                }
                const lastScore = await fetchRecentScore(userDataLast.osuId);
                if (lastScore.length === 0) {
                        ctx.reply("❌ | последних скоров не найдено");
                        break;
                }

                const scoreElement = lastScore[0];
                const beatmap = scoreElement.beatmap;
                const beatmapset = scoreElement.beatmapset;
                const statistics = scoreElement.statistics;
                const acc = (Math.floor(scoreElement.accuracy * 1000) / 10)

                const message = `
                        <b>Ваш последний рекорд</b><a href="${beatmapset.covers["cover@2x"]}">:</a>\n\n
                        На <code>${beatmap.status}</code> карте <b><a href="https://osu.ppy.sh/s/${beatmapset.id}">${beatmapset.title_unicode}</a></b> от <a href="https://osu.ppy.sh/users/${beatmapset.user_id}">${beatmapset.creator}</a> на сложности <a href="https://osu.ppy.sh/b/${beatmap.id}">${beatmap.version}</a>\n
                        <b><u>Попадания:</u></b>\n
                        <i>300</i>: <b>${statistics.count_300}</b>\n
                        <i>100</i>: <b>${statistics.count_100}</b>\n
                        <i>50</i>: <b>${statistics.count_50}</b>\n
                        ❌: <b>${statistics.count_miss}</b>\n
                        Пройдено на ранк <b>${scoreElement.rank}</b> с точностью <u>${acc}%</u>
                        ${scoreElement.pp != null ? `\nЗаработано <b>${Math.round(scoreElement.pp)}</b>pp` : `\n<b>pp не заработано</b>`}
                        Карта пройдена ${scoreElement.passed ? "" : "не "}полностью
                `;

                const keyboard = Markup.inlineKeyboard([
                        [Markup.button.callback("🔗 | юзер", `user_${scoreElement.user.id}`)],
                        [Markup.button.callback("🔗 | диффа", `bm_${beatmap.id}`)],
                ]);

                ctx.reply(message, { parse_mode: 'HTML', ...keyboard });
                break;
            default:
              ctx.reply("❌ | неизвестная команда");
          }
        }
      });
*/   

      

bot.on("message:text", async (ctx) => { 
    if (ctx.message?.text.match(/osu.ppy.sh\/beatmapsets\/\d+#([A-Za-z0-9]+)\/\d+/g)) {
		beatmap.getBeatmapsetData(ctx, ctx.message?.text.slice(ctx.message?.text.indexOf('beatmapsets/') + 11 + 1, ctx.message?.text.indexOf('#')), ctx.message?.text.slice(ctx.message?.text.lastIndexOf('/') + 1));
	} else if (ctx.message?.text.match(/osu.ppy.sh\/beatmapsets\/\d+/g)) {
		beatmap.getBeatmapsetData(ctx, ctx.message?.text.slice(ctx.message?.text.indexOf('beatmapsets/') + 11 + 1), undefined);
	} else if (ctx.message?.text.match(/osu.ppy.sh\/b\/\d+/g)) {
		beatmap.getBeatmapData(ctx, ctx.message?.text.slice(ctx.message?.text.lastIndexOf('/') + 1));
	} else if (ctx.message?.text.match(/osu.ppy.sh\/s\/\d+/g)) {
		beatmap.getBeatmapsetData(ctx, ctx.message?.text.slice(ctx.message?.text.lastIndexOf('/') + 1), undefined);
	} else if (ctx.message?.text.match(/^(http(s)?:\/\/)?osu.ppy.sh\/(users|u)\/[0-9A-Za-z_!\?\-\[\]%]+$/)) {
		var userId = ctx.message?.text.match(/^(http(s)?:\/\/)?osu.ppy.sh\/(users|u)\/[0-9A-Za-z_!\?\-\[\]%]+/)![0].replace(/(http(s)?:\/\/)?osu.ppy.sh\/(users|u)\/$/, '');
		if (userId.includes('/')) userId =  userId.slice(0,userId.indexOf('/'));
                const data = await User.findOne({tgId: ctx.message.from.id})
                user.requestDataById(ctx, userId)
        } else if (ctx.message?.text.match(/^(osu|o)!(user|u) ([a-zA-Z0-9 _]+)$/)) {
                const data = await User.findOne({tgId: ctx.message.from.id})
                user.requestData(ctx, ctx.message?.text.match(/^(osu|o)!(user|u) ([a-zA-Z0-9 _]+)$/)[3])
        }  else if (ctx.message?.text.match(/^(osu|o|O)!get$/)) {
                let mess = (ctx.message as any)
                if (mess?.reply_to_message) {
                        const tgId = mess.reply_to_message.from.id
                        if (tgId == ctx.message?.from.id) {
                                ctx.reply("❌ | изпользуйте o!me")
                        } else {
                        const target = await User.findOne({tgId: tgId}) 
                        const caller = await User.findOne({tgId: ctx.message.from.id}) 
                        if (target === null) {
                                ctx.reply("❌ | аккаунт пользователя не привязан.\nпривяжите его командой osu!link")
                        } else {
                        
                        user.requestDataById(ctx, target.osuId)     
                        }}
                } else {
                        ctx.reply("❌ | команду надо отправлять в ответ на сообщение")
                }
                
        } else if (ctx.message?.text.match(/^(osu|o|O)!help$/) || ctx.message?.text.match(/\/help/)) {
                text.help(ctx)
        } else if ((ctx.message?.text.match(/^(osu|o|O)!(settings|set)$/) || ctx.message?.text.match(/\/settings/))) {
                const data = await User.findOne({tgId: ctx.message.from.id})
                if (data === null) {
                        ctx.reply("🤓 | Простите сэр, но настройки доступны только авторизованым людям.\nАвторизоваться можно командой osu!link.")
                } else {
                        if (ctx.message.chat.type != "private") {
                                ctx.reply("🤓 | Простите сэр, но настройки доступны только в личных сообщениях с ботом.")
                        } else {
				settings.start(ctx)
			}
                        
                } 
                
        } else if (ctx.message?.text.match(/^(osu|o|O)!(random|rnd) ?((?:[1-9])-(?:10|[1-9]))?$/)) {
	        const range = ctx.message?.text.match(/^(osu|o|O)!(random|rnd) ?((?:[1-9])-(?:10|[1-9]))?$/)[3] || "0-10"
	        const rq = `https://beatconnect.io/api/search/?s=ranked&m=std&diff_range=${range}&token=TOKENREMOVED&p=${randomInterval(1, 600)}`
                axios.get(rq)
                        .then((res) => {
				//console.log(res.data[0])
                                beatmap.getBeatmapData(ctx, res.data["beatmaps"][randomInterval(0, 49)]["id"], undefined);
                        })
        } else if (ctx.message?.text.match(/^(osu|o|O)!(db|list)$/)) {
                ctx.reply(
                        "списки",
                        Markup.inlineKeyboard([
                          Markup.button.webApp(
                            "Бейджи",
                            "https://oki.nyako.tk/badges"
                          ),
                        ])
                      );
        } else if (ctx.message?.text.match(/(osu|o|O)!me/)  || (ctx.message?.text.match(/\/me/))) {
	        if (ctx.message?.text.includes("52")) {ctx.react("😍")}
                //const id = await client.get(ctx.message.from.id.toString())
                const data = await User.findOne({tgId: ctx.message.from.id})
                //console.log(data.settings)
                if (data === null) {
                        ctx.reply("❌ | аккаунт не привязан.\nпривяжите его командой osu!link")
                } else {
                        user.requestData(ctx, data.osuId)
                        
                }
                
        }  else if (ctx.message?.text.match(/^(osu|o|O)!last$/)  || ctx.message?.text.match(/\/lastscore/)) {
                let mess = (ctx.message as any)
                const is_last = true
                if (mess?.reply_to_message) {
                        const tgId = mess.reply_to_message.from.id
                        if (tgId == ctx.message?.from.id) {
                                ctx.reply("❌ | изпользуйте o!last без ответа")
                        } else {
                                const target = await User.findOne({tgId: tgId}) 
                                //const caller = await User.findOne({tgId: ctx.message.from.id}) 
                                if (target === null) {
                                        ctx.reply("❌ | аккаунт не привязан")
                                } else {
                                        const score = await fetchRecentScores(target.osuId)
                                        if (score.length > 0) {
                                                const card = await scoresCard(score, is_last)
                                                var inlineKeyboard = new InlineKeyboard()
                                                var i = 0
                                                for (let item of score) {
                                                        inlineKeyboard.text(item.beatmapset.title, `score_${i}_${is_last}_${target.osuId}_${ctx.message.message_id}`).row()
                                                        i += 1
                                                }
                                                ctx.replyWithPhoto(new InputFile(card, "img.png"), {
                                                        reply_to_message_id: ctx.update.callback_query ? ctx.update.callback_query.message.message_id : ctx.message.message_id,
                                                        reply_markup: inlineKeyboard,
                                                      });

                                        } else {
                                                ctx.reply("❌ | последних скоров не найдено")
                                        }
                                }
                                
                        }
                } else {
                        const user = await User.findOne({tgId: ctx.message.from.id})
                        if (user === null) {
                                ctx.reply("❌ | аккаунт не привязан")
                        } else {
                                        const score = await fetchRecentScores(user.osuId) //  user.osuId
                                        if (score.length > 0) {
                                                const card = await scoresCard(score, is_last)
                                                var inlineKeyboard = new InlineKeyboard()
                                                var i = 0
                                                for (let item of score) {
                                                        inlineKeyboard.text(item.beatmapset.title, `score_${i}_${is_last}_${user.osuId}_${ctx.message.message_id}`).row()
                                                        i += 1
                                                }
                                                ctx.replyWithPhoto(new InputFile(card, "img.png"), {
                                                        reply_to_message_id: ctx.update.callback_query ? ctx.update.callback_query.message.message_id : ctx.message.message_id,
                                                        reply_markup: inlineKeyboard,
                                                      });

                                        } else {
                                        ctx.reply("❌ | последних скоров не найдено")
                                }
                        }
                }
                
                
        } else if (ctx.message?.text.match(/^(osu|o|O)!unlink$/)) { 
                //client.del(ctx.message.from.id.toString())
                await User.deleteOne({tgId: ctx.message.from.id})
                ctx.reply("➖ | Аккаунт отвязан")
        } else if (ctx.message?.text.match(/^(osu|o|O)!best$/)  || ctx.message?.text.match(/\/bestscore/)) {
                let mess = (ctx.message as any)
                const is_last = false
                if (mess?.reply_to_message) {
                        const tgId = mess.reply_to_message.from.id
                        if (tgId == ctx.message?.from.id) {
                                ctx.reply("❌ | изпользуйте o!best без ответа")
                        } else {
                                const target = await User.findOne({tgId: tgId}) 
                                //const caller = await User.findOne({tgId: ctx.message.from.id}) 
                                if (target === null) {
                                        ctx.reply("❌ | аккаунт не привязан")
                                } else {
                                        const score = await fetchBestScores(target.osuId)
                                        if (score.length > 0) {
                                                const card = await scoresCard(score, is_last)
                                                var inlineKeyboard = new InlineKeyboard()
                                                var i = 0
                                                for (let item of score) {
                                                        inlineKeyboard.text(item.beatmapset.title, `score_${i}_${is_last}_${target.osuId}_${ctx.message.message_id}`).row()
                                                        i += 1
                                                }
                                                ctx.replyWithPhoto(new InputFile(card, "img.png"), {
                                                        reply_to_message_id: ctx.update.callback_query ? ctx.update.callback_query.message.message_id : ctx.message.message_id,
                                                        reply_markup: inlineKeyboard,
                                                      });
                                        } else {
                                                ctx.reply("❌ | скоров не найдено")
                                        }
                                }
                                
                        }
                } else {
                        const user = await User.findOne({tgId: ctx.message.from.id})
                        if (user === null) {
                                ctx.reply("❌ | аккаунт не привязан")
                        } else {
                        const score = await fetchBestScores(user.osuId)
                        //console.log(score)
                                if (score.length > 0) {
                                        const card = await scoresCard(score, is_last)
                                        var inlineKeyboard = new InlineKeyboard()
                                        var i = 0
                                        for (let item of score) {
                                                inlineKeyboard.text(item.beatmapset.title, `score_${i}_${is_last}_${user.osuId}_${ctx.message.message_id}`).row()
                                                i += 1
                                        }
                                        ctx.replyWithPhoto(new InputFile(card, "img.png"), {
                                                reply_to_message_id: ctx.update.callback_query ? ctx.update.callback_query.message.message_id : ctx.message.message_id,
                                                reply_markup: inlineKeyboard,
                                              });
                                } else {
                                        ctx.reply("❌ | скоров не найдено")
                                }
                        }
                }
                
                
        } else if (ctx.message?.text.match(/^(osu|o|O)!link$/)) {
                if (ctx.message.chat.type != "private") {
                        ctx.reply("🤓 | Простите сэр, но авторизация доступна только в личных сообщениях с ботом.")
                } else {
                const user = await User.findOne({tgId: ctx.message.from.id})
                if (user) {
                        ctx.reply("❌ | аккаунт уже привязан.")
                } else {
                        const link = account.genAuthLink(ctx.message.from.id)
                ctx.reply("привязать аккаунт", {
                        ...Markup.inlineKeyboard([
                                [Markup.button.url("➕ | привязать osu", link.osu)],
                                //[Markup.button.url("➕ | привязать lisek", link.lisek)]
                        ]),
                })
                }
                }
        }
    
  });
  /* else if (ctx.message?.text.match(/^(osu|o)!unlink$/)) { 
                //client.del(ctx.message.from.id.toString())
                await User.deleteOne({tgId: ctx.message.from.id})
                ctx.reply("➖ | Аккаунт отвязан")
        }
   */
  /*else if (ctx.message?.text.match(/^(osu|o)!(search) ([A-Za-zА-Яа-я0-9. -,!]+)$/)) {
                const data = await User.findOne({tgId: ctx.message.from.id})
                const bm = await fetchBmByStarrate(ctx.message?.text.match(/^(osu|o)!(search) ([A-Za-zА-Яа-я0-9. -,!]+)$/)[3])
                beatmap.getBeatmapsetData(ctx, bm, undefined);
    } */


if (process.env.deployType == "production") {
  process.on('uncaughtException', function (exception) {
        console.log(exception.toString())
        process.exit()
       });
}
  
// Graceful Shutdown
process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

bot.start({
        async onStart(botInfo) {
                console.log(new Date(), 'Telegram bot starts as', botInfo.username);
                process.env.deployType != "dev" ? await connectAndRunIRC(bot.api) : null;
        },
});


export {bot}
