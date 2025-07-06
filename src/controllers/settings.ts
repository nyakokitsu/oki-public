import { Input, Markup } from 'telegraf';
import { User } from '../db/models/user';
import axios from 'axios';
import { GrammyError, InlineKeyboard } from 'grammy';
import {
    type Conversation
  } from "@grammyjs/conversations";
import { Context } from 'grammy';
import type {MyContext} from '../context';


type MyConversation = Conversation<MyContext>;

async function start(ctx) {
    if (ctx.update.callback_query) {
        await ctx.editMessageText("Настройки", {
            ...Markup.inlineKeyboard([
                /*[Markup.button.callback("Карточки юзеров", "settingcategory_userCard")],*/ [Markup.button.callback("Настройки рендера", "settingcategory_render")]
        ]),
    })
    } else {
        await ctx.reply("Настройки", {
            ...Markup.inlineKeyboard([
                /*[Markup.button.callback("Карточки юзеров", "settingcategory_userCard")],*/ [Markup.button.callback("Настройки рендера", "settingcategory_render")]
        ]),
    })
    }
    
}


// Мне поебать что это из другой библиотеки, главное что я ниебаце прогер 
async function category(ctx, category) {
    if (category == "render") {
        const prefs = await User.findOne({tgId: ctx.update.callback_query.from.id})
        /*if (prefs.isDonator ) {
            var {data} = await axios.get(`https://apis.issou.best/ordr/skins/custom?id=${prefs.settings.rendering.donatorSkin}`)
        }*/
        await ctx.editMessageText(`Выберете настройку\nТекущий скин${prefs.isDonator ? " id" : ""} рендера: <code>${prefs.isDonator ? prefs.settings.rendering.donatorSkin : prefs.settings.rendering.skin}</code>\nстраница: 1/2`, {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
                [Markup.button.callback("Скин", "skinchoose")],
                [Markup.button.callback("Видео", "settingchoosing_video"),
                Markup.button.callback("Параллакс", "settingchoosing_parallax"),
                Markup.button.callback("Пропуск интро", "settingchoosing_skipIntro")
            ],
                [Markup.button.callback("Страница 2 →", "settingcategory_render2")]
        ]),
        
    })
    } else if (category == "render2") {
        const prefs = await User.findOne({tgId: ctx.update.callback_query.from.id})

        var buttons = [
            [Markup.button.callback("Показывать счетчик pp", "settingchoosing_ppcounter")],
            [Markup.button.callback("Игнорировать фейлы", "settingchoosing_ignorefail")],
            [Markup.button.callback("Показывать сториборд", "settingchoosing_storyboard")],
            [Markup.button.callback("Показывать экран с результатами", "settingchoosing_finalresults")],
            [Markup.button.callback("← Страница 1", "settingcategory_render")]
    ]
        
            buttons.splice(2, 0, ([Markup.button.callback("Донаторские скины", "settingchoosing_skinSys"), Markup.button.callback("Установить скин", "settingchoosing_setSkin")]))
        
        
        await ctx.editMessageText(`Выберете настройку\nстраница: 2/2`, {
            ...Markup.inlineKeyboard(buttons),
    })
    }
}

async function skinChangeDialog(conversation: Conversation<Context>, ctx: Context) {
    await ctx.reply("Введите id скина:");
    const { message } = await conversation.wait();
    var {data} = await axios.get(`https://apis.issou.best/ordr/skins/custom?id=${message.text}`)
    if (data.found) {
        const data = await User.findOneAndUpdate({ tgId: message.from.id }, { "settings.rendering.donatorSkin": message.text });
        await ctx.reply(`Успешно установлен id: <i>${message.text}</i>!`, {parse_mode: 'HTML'});
        return;
    } else {
        await ctx.reply(`❌ | Не удалось установить скин. Вероятно его не существует!`, {parse_mode: 'HTML'});
        return;
    }
    
}


async function choose(ctx, setting, User) {
    const data = await User.findOne({ tgId: ctx.update.callback_query.from.id });
  
    let currentParam;
    let keyboard;
    let set;
    let settings = data.settings
    
    if (setting == "setSkin"){
        await ctx.conversation.enter("skin-dialog");
    }else {
    switch (setting) {
      case "legacyUserCard":
        currentParam = settings.useLegacyCards;
        set = "useLegacyCards"
        break;
      case "finalresults":
        currentParam = settings.results;
        set = "results"
        break;
      case "video":
        currentParam = settings.rendering.video;
        set = "renderVideo"
        break;
      case "storyboard":
        currentParam = settings.rendering.showStoryboard
        set = "renderstb"
        break;
      case "ppcounter":
        currentParam = settings.rendering.showPPCounter
        set = "ppcounter"
        break;
      case "parallax":
        currentParam = settings.rendering.paralax
        set = "renderParallax"
        break;
      case "ignorefail":
        currentParam = settings.useLaser
        set = "ignorefail"
        break;
      case "skipIntro":
        currentParam = settings.rendering.skipIntro
        set = "renderSkipIntro"
        break;
      case "skinSys":
        currentParam = data.isDonator
        set = "skinSys"
        break;
    }
  
    let text = `настройте параметр\nТекущее состояние: ${currentParam ? "Включено" : "Выключено"}`
    const inlineKeyboard = new InlineKeyboard()
        .text("Включить", `set_${set}_true`)
        .text("Выключить", `set_${set}_false`).row()
        .text("На главную", "settingsmenu");
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: inlineKeyboard });
}
  }


async function set(ctx, setting, set, User) {
    const keyboard = [
        [
            InlineKeyboard.text( "Включить", `set_${setting}_true` ),
            InlineKeyboard.text( "Выключить", `set_${setting}_false` )
        ],
        [InlineKeyboard.text( "На главную", `settingsmenu` )]
    ];

    let updatePath;
    let text;

    switch (setting) {
        case "useLegacyCards":
            updatePath = { "settings.useLegacyCards": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "renderParallax":
            updatePath = { "settings.rendering.paralax": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "results":
            updatePath = { "settings.rendering.results": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "renderstb":
            updatePath = { "settings.rendering.showStoryboard": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "ppcounter":
            updatePath = { "settings.rendering.showPPCounter": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "ignorefail":
            updatePath = { "settings.useLaser": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "renderVideo":
            updatePath = { "settings.rendering.video": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "skinSys":
            updatePath = { "isDonator": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
        case "renderSkipIntro":
            updatePath = { "settings.rendering.skipIntro": set };
            text = `настройте параметр\nТекущее состояние: ${set == "true" ? "Включено" : "Выключено"}`;
            break;
    }

    const data = await User.findOneAndUpdate({ tgId: ctx.update.callback_query.from.id }, updatePath);
    try {
        await ctx.editMessageText(text, { reply_markup: InlineKeyboard.from(keyboard) });
    } catch {
        // do nothing lol
    }
    
}



export {start, category, choose, set, skinChangeDialog}
