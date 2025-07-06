import { IOptions, IAPIUser } from '../utils/interfaces';

import { InputFile, InlineKeyboard, Context } from 'grammy';
import * as format from '../utils/format';
import * as error from '../utils/error';
import * as utility from '../utils/utils';
import * as API from '../utils/API';
import * as score from '../utils/score';
import * as banner from '../utils/osuAPIv2'
import * as colours from '../utils/colours';
import { User } from '../db/models/user';


import axios from 'axios';
const Canvas = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { GlobalFonts, createCanvas, loadImage } = require('@napi-rs/canvas');
const { join } = require('path')

var countryCodes = require('../assets/country_codes.json');

GlobalFonts.registerFromPath(join(__dirname, '..', 'assets', 'VarelaRound.ttf'), 'VarelaRound');

GlobalFonts.registerFromPath(join(__dirname, '..', 'assets', 'Mulish.ttf'), 'Mulish');

var time = Date.now();


async function requestData(contx: Context, user: string | undefined, options: IOptions = {
  error: false,
  mode: 0,
  laser: false
}) {
  options.type = options.type ? options.type : 0;
  const res = await API.getUser(user, options.mode, options.type, options.relax, options.laser)
      if (res.length == 0) {
        contx.reply(`❌ | Игроков с ником \`${user}\` не найдено`);
        return 
      }
      generateUser(contx, options, res);
    
}

async function requestDataById(contx: Context, userId: string | undefined, options: IOptions = {
    error: false,
    mode: 0,
    laser: false
  }) {
    options.type = options.type ? options.type : 0;
    const res = await API.getUser(userId, options.mode, options.type, options.relax, options.laser)
        if (res.length == 0) {
          contx.reply(`❌ | Игроков с id \`\`\`${userId}\`\`\` не найдено`);
          return 
        }
        generateUser(contx, options, res);
      
  }

async function generateUser(contx: Context, options: IOptions, body: Array<IAPIUser>) {
  contx.replyWithChatAction("upload_photo")
  var modes = ['osu', 'taiko', 'fruits', 'mania'];
  var canvas = createCanvas(1200, 624);
  var ctx = canvas.getContext('2d');
  const is_cbq = contx.callbackQuery != undefined

  const userInfo = await banner.fetchUserInfo(body[0].user_id)
  //console.log(userInfo)
  options.mode = modes.indexOf(userInfo.playmode)
  var backgroundUrl;
  var userSettings = await User.findOne({osuId: body[0].user_id})
  var callerSettings = await User.findOne({tgId: (is_cbq ? contx.callbackQuery.from.id : contx.message.from.id)})
  if (userSettings) {
      if (userSettings.settings.customBg != "") {
        backgroundUrl = userSettings.settings.customBg
      } else {
        backgroundUrl = userInfo.cover.url
      }
    
  }

   //useLegacyRenderer ? path.resolve(__dirname, '../assets/background.png') : 
  
  backgroundUrl = backgroundUrl == undefined ? "https://files.catbox.moe/0wdcm9.png" : backgroundUrl
  colours.getColours(backgroundUrl, false, async function (colour) {
  /*if (!useLegacyRenderer) {
    let colourNumber = colours.toReadable(colours.toRGB(colour.foreground), colours.toRGB(colour.background));
    colour.foreground = colours.toHex(colourNumber.foreground);
    colour.background = colours.toHex(colourNumber.background);
  }*/
  
  var mainColour = '#ffffff';
  if (colours.getColorBlack(colour.background)) {
    mainColour = "#ffffff"
  } else {
    mainColour = "#000000"
  }
  

  ctx.beginPath();
  ctx.fillStyle = colour.background;
  format.rect(ctx, 0, 0, canvas.width, canvas.height, 45);
  ctx.fill();

  
  let backgroundImage = await loadImage(backgroundUrl);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 40;
  ctx.save();
  format.rect(ctx, 0, 0, canvas.width, 432, 45);
  ctx.clip();
  /*if (useLegacyRenderer) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height + 71);
  } else {*/
  
  if (mainColour == "#000000") {
    ctx.globalCompositeOperation = "soft-light"
  }
  
    ctx.drawImage(backgroundImage, -500, 0, canvas.width + 1000, canvas.height + 71);
  
  
  
  
  if (mainColour == "#000000") {
    ctx.fillStyle = "rgb(100, 100, 100)";
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0,0,canvas.width,canvas.height)
  ctx.globalCompositeOperation = "source-over"
  ctx.globalAlpha = 1;
  }

    
    if (mainColour == "#ffffff") {
      ctx.globalCompositeOperation = "multiply"
      ctx.fillStyle = "rgb(100, 100, 100)";  // dest pixels will darken by
                                     // (128/255) * dest
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0,0,canvas.width,canvas.height)
      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1;
    }
    
  //}
  
  ctx.clip();
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.save();

  var userPictureUrl = userInfo.avatar_url;

  /*if (options.type == 1) {
    userPictureUrl = `https://a.gatari.pw/${body[0].user_id}?${Date.now().toString()}`;
  } else if (options.type == 2) {
    userPictureUrl = `https://a.akatsuki.pw/${body[0].user_id}?${Date.now().toString()}`;
  }*/
  var userPicture;
  try {
    userPicture = await loadImage(userPictureUrl);
  } catch (err) {
    userPicture = await loadImage('https://osu.ppy.sh/images/layout/avatar-guest.png');
  }
  format.rect(ctx, 44, 55, 277, 277, 47);
  ctx.clip();

  var scale = Math.max(280 / userPicture.width, 280 / userPicture.height);
  var x = 170 + 14 - (userPicture.width / 2) * scale;
  var y = 170 + 25 - (userPicture.height / 2) * scale;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 40;
  ctx.drawImage(userPicture, x, y, userPicture.width * scale, userPicture.height * scale);
  ctx.restore();

  ctx.beginPath();
  ctx.ellipse(268 + 30, 277 + 30, 40, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  
  var icon = await loadImage(path.resolve(__dirname, `../assets/${modes[options.mode || 0]}.png`));
  ctx.drawImage(icon, 252, 261, 86, 86);

  if (userInfo.is_supporter) {
    let heart = await loadImage("https://github.com/ppy/osu-web/blob/master/public/images/badges/heart@2x.png?raw=true");
	  ctx.drawImage(heart, 40, 261, 86, 86);
  }
	

  ctx.fillStyle = mainColour;
  ctx.font = '63px VarelaRound';
  ctx.fillText(body[0].username, 347, 56 + 63);

  ctx.font = '40px VarelaRound';
  let country = countryCodes[body[0].country];
  var flag = await loadImage(`https://osu.ppy.sh/images/flags/${body[0].country}.png`);
  ctx.drawImage(flag, 350, 130, 60, 40);
  ctx.fillText(country, 420, 127 + 40);

  var gradeA = await loadImage(path.resolve(__dirname, '../assets/grade_a.png'));
  var gradeS = await loadImage(path.resolve(__dirname, '../assets/grade_s.png'));
  var gradeSS = await loadImage(path.resolve(__dirname, '../assets/grade_ss.png'));
  var gradeSH = await loadImage(path.resolve(__dirname, '../assets/grade_sh.png'));
  var gradeSSH = await loadImage(path.resolve(__dirname, '../assets/grade_ssh.png'));

  ctx.drawImage(gradeA, 766, 112 + 25, 98, 50);
  ctx.drawImage(gradeS, 922, 112 + 25, 98, 50);
  ctx.drawImage(gradeSH, 1080, 112 + 25, 98, 50);
  ctx.drawImage(gradeSS, 847, 221 + 25, 98, 50);
  ctx.drawImage(gradeSSH, 1002, 221 + 25, 98, 50);

  ctx.font = '28px VarelaRound';
  ctx.textAlign = 'center';
  ctx.fillText(format.number(parseInt(userInfo.statistics.grade_counts.a) || 0), 792 + 22, 171 + 25 + 28);
  ctx.fillText(format.number(parseInt(userInfo.statistics.grade_counts.s) || 0), 955 + 16, 171 + 25 + 28);
  ctx.fillText(format.number(parseInt(userInfo.statistics.grade_counts.sh) || 0), 1108 + 22, 171 + 25 + 28);
  ctx.fillText(format.number(parseInt(userInfo.statistics.grade_counts.ss) || 0), 888 + 9, 279 + 25 + 28);
  ctx.fillText(format.number(parseInt(userInfo.statistics.grade_counts.ssh) || 0), 1038 + 13, 279 + 25 + 28);

  ctx.textAlign = 'left';
  ctx.font = '75px VarelaRound';
  ctx.fillText('#' + format.number(parseInt(userInfo.statistics.global_rank) || 0), 347, 170 + 75);

  ctx.font = '57px VarelaRound';
  ctx.fillText('#' + format.number(parseInt(userInfo.statistics.country_rank) || 0), 347, 259 + 57);

  
  var hexagon = await loadImage(path.resolve(__dirname, '../assets/hexagon.png'));
  ctx.drawImage(hexagon, 342, 332, 72, 77);

  const level = parseFloat(userInfo.statistics.level.current);

  ctx.textAlign = 'center';
  ctx.font = '33px VarelaRound';
  ctx.fillText(Math.floor(level | 0), 378, 332 + 50);

  ctx.font = '25px VarelaRound';
  ctx.fillText(Math.floor(level).toString(), 377.5, 377);

  format.rect(ctx, 441, 364, 504, 12, 7);
  ctx.fillStyle = '#FFCC22';
  format.rect(ctx, 441, 364, 504 * (userInfo.statistics.level.progress / 100), 12, 7);
  ctx.textAlign = 'left';
  
  ctx.fillStyle = mainColour;
  ctx.font = '21px VarelaRound';
  ctx.fillText(Math.floor(userInfo.statistics.level.progress) + '%', 960, 359 + 21);

  ctx.fillStyle = mainColour + '21';
  format.rect(ctx, 44, 472, 191, 53, 30);
  format.rect(ctx, 278, 472, 232, 53, 30);
  format.rect(ctx, 547, 472, 306, 53, 30);
  format.rect(ctx, 897, 472, 250, 53, 30);


  ctx.fillStyle = mainColour;
  ctx.textAlign = 'center';
  ctx.font = '30px Mulish';
  ctx.fillText('pp', 118 + 20, 476 + 30);
  ctx.fillText('Точность', 314 + 80, 478 + 30);
  ctx.fillText('Часов сыграно', 592 + 110, 476 + 30);
  ctx.fillText('Очков', 973 + 50, 478 + 30);

  ctx.font = '40px Mulish';
  ctx.fillText((format.number(Math.round(parseFloat(userInfo.statistics.pp) || 0))), 82 + 60, 534 + 40);
  ctx.fillText(((Math.round((parseFloat(userInfo.statistics.hit_accuracy) || 0) * 100) / 100)) + '%', 324 + 75, 537 + 40);
  ctx.fillText(format.number(Math.floor((parseFloat(userInfo.statistics.play_time) || 0) / 60 / 60)) + 'ч', 651 + 50, 536 + 40);
  // ctx.fillText(format.number(Math.floor(parseInt(body[0].total_seconds_played) || 0) / 60 / 60) + 'h', 651 + 50, 536 + 40);
  ctx.fillText(format.numberSuffix(parseInt(userInfo.statistics.total_score) || 0), 930 + 100, 536 + 40);

 
  const userId = Number(body[0].user_id);
  const donation = userSettings && userSettings.settings.rendering.hiRes
    ? `Этот пользователь поддержал бота. Спасибо!`
    : "";

  if (userId === 29983625) {
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.font = "68px VarelaRound";
    ctx.fillText("5252", 250, 400);
  }
  if (userId === 25966523) {
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.font = "68px VarelaRound";
    ctx.fillText("727", 250, 400);
  }
  
  const track = await axios.post(`https://osutrack-api.ameo.dev/update?user=${body[0].user_id}&mode=${options.mode}`)



  const userDomain = getUserDomain(options.type);
  const inlineKeyboard = new InlineKeyboard().url("user", `${userDomain}${userId}`); // .row().text("SIP", `sip_${userId}`)


  if (callerSettings && callerSettings.settings.rendering.hiRes) {
    inlineKeyboard.row().text("SIP", `sip_${userId}`)
  }
  if (userId === 23325778) {
    contx.replyWithVideo("https://files.catbox.moe/3j00pu.mp4");
  }  else if (userId === 4787150) {
	  contx.replyWithPhoto("https://files.catbox.moe/yjxpad.png")
  } else {
    const caption = `${track.data.first ? "ваша учетная запись теперь отслеживается на osutrack" : `[osutrack](https://ameobea.me/osutrack/user/${body[0].username})`}\n[osuskills](https://osuskills.com/user/${body[0].username})\n*Достижений:* **${userInfo.user_achievements.length}**\n*Плейкаунт*: ${userInfo.statistics.play_count}\n*Ранговых очков*: ${format.numberSuffix(parseInt(userInfo.statistics.ranked_score) || 0)}\n*${donation}*\n${Math.random() < 0.3 ? "" : ""}`;
    contx.replyWithPhoto(new InputFile(canvas.toBuffer("image/png"), "img.png"), {
      caption,
      reply_to_message_id: contx.update.callback_query ? contx.update.callback_query.message.message_id : contx.message.message_id,
      parse_mode: "Markdown",
      reply_markup: inlineKeyboard,
    });
  }

  console.log(`GENERATED USER CARD : ${userDomain}${userId}`);
  return body;
})
}

const getUserDomain = (webId: number) => {
  const domains = [
    `https://osu.ppy.sh/users/`,
    "https://osu.gatari.pw/u/",
    "https://akatsuki.gg/u/",
  ];
  return domains[webId];
};

export { requestData, requestDataById };
