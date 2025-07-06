//@ts-ignore
import axios from 'axios';
import { InlineKeyboard, InputFile } from 'grammy';
const FormData = require('form-data')
const ufs = require("url-file-size");


const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchReplay(ctx: any, User: any, url: string) {
  const user = await User.findOne({ tgId: ctx.message.from.id });

  const form = new FormData();
  let needCustomSkin = (user.isDonator && user.settings.rendering.donatorSkin !== undefined);
  form.append("replayURL", url.toString());
  form.append("skin", needCustomSkin ? user.settings.rendering.donatorSkin : user.settings.rendering.skin);
  form.append("customSkin", needCustomSkin ? "true" : "false");
  form.append("showDanserLogo", "false");
  form.append("verificationKey", "TOKENREMOVED");
  form.append("resolution", "1280x720");
  form.append("BGParallax", user.settings.rendering.paralax.toString());
  form.append("username", "Oki-Chan");
  form.append("loadVideo", user.settings.rendering.video.toString());
  form.append("loadStoryboard", user.settings.rendering.showStoryboard.toString());
  form.append("skip", user.settings.rendering.skipIntro.toString());
  form.append("showPPCounter", user.settings.rendering.showPPCounter.toString());
  form.append("showUnstableRate", "false");

  try {
    const { data } = await axios.post("https://apis.issou.best/ordr/renders", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    console.log(err.response.data);
    return err.response.data;
  }
}




async function fetchUpdate(id: string): Promise<any> {
    try {
        const response = await axios.get(`https://apis.issou.best/ordr/renders?renderID=${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function getBuffer(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function genVideo(ctx: any, User, url: string) {
                        
                        const id = await fetchReplay(ctx, User, url);
                        //console.log(id)
                        
                        //console.log(await replays.fetchUpdate(1237291))
                        
                                //lastUse.addCommandUsage(ctx.message.from.id.toString())
                        //console.log(id.errorCode)
                        if (id.errorCode == 30) {
                            ctx.reply("❌ | 20+ стар карты не рендерятся")
                        } else if (id.errorCode == 6) {
                            ctx.reply("❌ | реплей не osu!std")
                        } else if ((id.errorCode == 5) || (id.errorCode == 7)) {
                            ctx.reply("❌ | отправленный реплей поломан, попробуйте переэкспортировать его")
                        } else if (id.errorCode == 8) {
                            ctx.reply("❌ | битмапа нет на сайте osu! (возможно это неподтвержденная карта или кастомная сложность)")
                        } else if (id.errorCode == 9) {
                            ctx.reply("❌ | аудио битмапа недоступно")
                        } else if (id.errorCode == 11) {
                            ctx.reply("❌ | автоплей мод не рендерится")
                        } else if (id.errorCode == 12) {
                            ctx.reply("❌ | в имени реплея содержатся знаки ломающие рендер")
                        } else if (id.errorCode) {
                            ctx.reply(`❌ | произошла ошибка\n<pre>${id.message}</pre>`, {parse_mode: "HTML"})
                        } else {
                        const renderId = id.renderID                            
                        const message = await ctx.reply("*файл в работе*\n", {
                                        parse_mode: "MarkdownV2"
                                })
                                var isDone = false
                                ctx.replyWithChatAction("record_video_note")
                                await ctx.editMessageText(`*рендерим*`, {
                                    parse_mode: "MarkdownV2",
                                    message_id: message.message_id,
                                    chat_id: message.chat.id
                                })
                                do {
                                        var update = await fetchUpdate(renderId)
                                        //console.log(update)
                                        ctx.replyWithChatAction("record_video_note")
                                        isDone = (update.renders[0].progress === "Done.") ? true : false
                                        await delay(5000)
                                }
                                while (!isDone);
                                const renderDataPromise = await fetchUpdate(renderId)
                                const renderData = renderDataPromise.renders[0]
                                const { data } = await axios.get(`https://apis.issou.best/dynlink/ordr/gen?id=${renderData.renderID}`);
                                //const videoBuffer = await getBuffer(data.url);

                                //if (videoBuffer.toString().length > 50000000) {
                               //         await ctx.reply(`❌ | видео слишком большое\n<a href="${data.url}">Откройте его здесь</a>`, { parse_mode: "HTML" });
                               // } else {
                                        const keyboard = new InlineKeyboard()
                                            .text("🔗 | битмапсет", `bmset_${renderData.mapLink.replace("https://dl2.issou.best/ordr/maps/", "").replace(".osz", "")}`)
                                            .text("🔗 | автор реплея", `nick_${renderData.replayUsername}`)
                                            .row()
                                            .url("❤️ | okisupporter", "https://t.me/okisupporter");

                                        await ctx.reply(`<a href="${data.url}">открыть видео</a>\n<a href="${renderData.videoUrl}">открыть ordr</a>\n${renderData.title}`, { reply_markup: keyboard, parse_mode: "HTML", link_preview_options: { prefer_large_media: true, show_above_text: true } });
                                        await ctx.api.deleteMessage(message.chat.id, message.message_id)
                           // }
                        }
                                
                        
}

export {
    fetchUpdate,
    getBuffer,
    genVideo
}
