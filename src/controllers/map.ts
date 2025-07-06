/* eslint-disable no-useless-escape */

import { Input, Markup } from 'telegraf';
import * as error from '../utils/error';
import * as colours from '../utils/colours';
import * as format from '../utils/format';
//import * as argument from '../utils/argument';
import * as beatmap from '../utils/beatmap';
import * as API from '../utils/API';
//import * as database from '../utils/database';
//import * as getMap from '../utils/getMap';
import * as parser from '../utils/parser';
import {User} from '../db/models/user';
import {fetchScore} from '../utils/osuAPIv2';


// const tbbpp = require('tbbpp');
import axios from 'axios';
import { InlineKeyboard, InputFile } from 'grammy';
import { keyboard } from 'telegraf/typings/markup';
const Canvas = require('@napi-rs/canvas');
const { GlobalFonts } = require('@napi-rs/canvas')
const fs = require('fs');
const path = require('path');
const { join } = require('path')

GlobalFonts.registerFromPath(join(__dirname, '..', 'assets', 'VarelaRound.ttf'), 'VarelaRound');


GlobalFonts.registerFromPath(join(__dirname, '..', 'assets', 'Mulish.ttf'), 'Mulish');


function getBeatmapData(contx: any, beatmapid: string | undefined, isOsuSend: boolean = false, idToSend: number = null) {
	API.getBeatmap({
		beatmapID: beatmapid
	}).then((res: any) => {
		console.log(`DEBUG: #37 ${res[0].beatmapset_id}`)
		getBeatmapsetData(contx, res[0].beatmapset_id, beatmapid, isOsuSend, idToSend);
	}).catch((err : Error) => {error.unexpectedError(err, 'Err while callin api');});
}

function getBeatmapsetData(contx: any, beatmapsetid: string | undefined, beatmapid: string | undefined, isOsuSend: boolean = false, idToSend: number = null) {
	if (!isOsuSend) {
		contx.replyWithChatAction("upload_photo")
	} else {
		contx.sendChatAction(idToSend, "upload_photo")
	}
	
	API.getBeatmap({
		beatmapSetID: beatmapsetid
	}).then((res: any) => {

		if (res == undefined || res.length == 0) {
			error.unexpectedError(new Error('Unexpected empty or undefined response body'), `https://osu.ppy.sh/api/get_beatmaps?k=${process.env.osuAPI}&s=${beatmapsetid}`);
			return;
		}
		
		// If no beatmap is specified, set beatmap id to the hardest difficulty 
		// Cannot use the last index because osu's API seems to return beatmap difficulties in a random order
		if (beatmapid == undefined) {
			var highestIndex = 0;
			for (var i = 0; i < res.length; i++) {
				if (res[i].difficultyrating > res[highestIndex].difficultyrating) highestIndex = i;
			}
			beatmapid = res[highestIndex].beatmap_id;
		}

		var data: any = {};
		data.beatmaps = [];
		var modes = ['osu', 'taiko', 'fruits', 'mania'];
		for (i = 0; i < res.length; i++) {

			res[i].mode = modes[res[i].mode];
			res[i].difficulty_rating = res[i].difficultyrating;
			data.beatmaps.push(res[i]);
			if (res[i].beatmap_id == beatmapid) {
				data = {
					...res[i],
					...data
				}; // ...data
			}
		}

		var approved;
		if (data.approved == -2) approved = 'graveyard';
		else if (data.approved == -1) approved = 'WIP';
		else if (data.approved == 0) approved = 'pending';
		else if (data.approved == 1) approved = 'ranked';
		else if (data.approved == 2) approved = 'approved';
		else if (data.approved == 3) approved = 'qualified';
		else if (data.approved == 4) approved = 'loved';

		console.log(`DEBUG: #93 ${data.beatmapset_id}`)
		data = {
			...data,
			id: data.beatmapset_id,
			user_id: data.creator_id,
			url: 'https://osu.ppy.sh/beatmapsets/' + beatmapsetid + '#osu/' + beatmapid,
			status: approved,
			beatmap: {
				id: data.beatmap_id,
				difficulty_rating: data.difficultyrating,
				cs: data.diff_size,
				ar: data.diff_approach,
				drain: data.diff_drain,
				accuracy: data.diff_overall,
				max_combo: data.max_combo,
				total_length: data.total_length,
				version: data.version
			}
		};
		
		console.log(`BEATMAP DATA :  https://osu.ppy.sh/beatmapsets/${beatmapsetid}#osu/${beatmapid}`);
		generateBeatmap(contx, data, isOsuSend, idToSend);
		

	}).catch((err : Error) => {error.unexpectedError(err, "Err while callin API");});
}





function generateBeatmap(contx: any, data: any, isOsuSend, idToSend) {
	if (data.beatmap.id == undefined) {
		//error.log(msg, 4042);
		return;
	}
	// init the canvas
	let canvas = Canvas.createCanvas(1080, 620);
	let ctx = canvas.getContext('2d');
	let url = 'https://assets.ppy.sh/beatmaps/' + data.id + '/covers/cover@2x.jpg';
	axios.get(`https://osu.ppy.sh/osu/${data.beatmap.id}`)
		.then((res: any) => {
			var osuContent : any = parser.parseOsu(res.data);

			colours.getColours(url, false, async function (colour) {
				let colourNumber = colours.toReadable(colours.toRGB(colour.foreground), colours.toRGB(colour.background));
				colour.foreground = colours.toHex(colourNumber.foreground);
				colour.background = colours.toHex(colourNumber.background);
				ctx.fillStyle = colour.background;
				format.rect(ctx, 0, 0, canvas.width, canvas.height, 37);

				// Beatmap Image
				let beatmapImage;
				try {
					beatmapImage = await Canvas.loadImage(url);
				} catch (err) {
					beatmapImage = await Canvas.loadImage(path.resolve(__dirname, '../assets/unknown_bg.png')).catch((err: any) => {
						error.unexpectedError(err, 'Err while gen');
					});
				}

				/*var pp = await axios.get(`https://pp.osuck.net/pp?id=${data.beatmap.id}`)
					.then((data) => {return data.data})
					.catch((data) => {return false})*/

				ctx.shadowColor = 'rgba(0,0,0,0.8)';
				ctx.shadowBlur = 20;
				ctx.save();
				format.rect(ctx, 0, 0, canvas.width, 300, 37);
				ctx.clip();
				ctx.drawImage(beatmapImage, 0, 0, canvas.width, 300);
				ctx.restore();
				ctx.shadowBlur = 0;

				ctx.beginPath();
				ctx.fillStyle = '#3333338C';
				format.rect(ctx, 24, 20, 186, 46, 26);
				ctx.fillStyle = colour.foreground;
				format.rect(ctx, 24, 20, 46, 46, 26);
				ctx.font = '20px Mulish';
				ctx.textAlign = 'center';
				ctx.fillStyle = '#ffffff';
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = 1;
        		let status = data.status.slice(0, 1).toUpperCase() + data.status.slice(1).toLowerCase()
				switch (status) {
					case "Graveyard":
					  status = "Заброшен.";
					  break;
					case "Ranked":
					  status = "Ранговая";
					  break;
					case "Loved":
					  status = "Любимая";
					  break;
					case "Pending":
					  status = "На рассм.";
					  break;
					case "Qualified":
					  status = "Квалиф.";
					  break;
					case "Approved":
					  status = "Ранговая";
					  break;
					case "Wip":
					  status = "В разраб.";
					  break;
				  }
				ctx.fillText(status, 127, 51);
				ctx.strokeText(status, 127, 51);
				ctx.textAlign = 'center';
				let statusImage = await Canvas.loadImage(path.resolve(__dirname, '../assets/' + data.status + '.png')).catch((err: any) => {
					error.unexpectedError(err, 'Err while gen');
				});
				ctx.drawImage(statusImage, 37, 33, 20, 20);

				// title
				ctx.fillStyle = colour.foreground;
				ctx.strokeStyle = colour.foreground;
				ctx.lineWidth = 2;
				const cyrillicPattern = /[а-яА-ЯЁё]/;
				if (cyrillicPattern.test(data.title_unicode)) {
					ctx.font = '42px Mulish';
					ctx.textAlign = 'left';
					ctx.fillText(data.title_unicode, 41, 367);
					ctx.strokeText(data.title_unicode, 41, 367);
				} else {
					ctx.font = '42px VarelaRound';
					ctx.textAlign = 'left';
					ctx.fillText(data.title, 41, 367);
					ctx.strokeText(data.title, 41, 367);
				}

				if (cyrillicPattern.test(data.artist_unicode)) {
				ctx.font = '26px Mulish';
				ctx.lineWidth = 1;
				ctx.fillText(format.truncate(26, data.artist_unicode), 41, 406);
				ctx.strokeText(format.truncate(26, data.artist_unicode), 41, 406);
				} else {
					ctx.font = '26px VarelaRound';
				ctx.lineWidth = 1;
				ctx.fillText(format.truncate(26, data.artist), 41, 406);
				ctx.strokeText(format.truncate(26, data.artist), 41, 406);
				}

				// star rating
				let svgFile =  fs.readFileSync(path.resolve(__dirname, '../assets/star.svg'), 'utf8');
				svgFile = svgFile.replace(/fill="[#\.a-zA-Z0-9]+"/g, `fill="${colour.foreground}"`);
				const star = await Canvas.loadImage(Buffer.from(svgFile)).catch((err: any) => {
					error.unexpectedError(err, 'Err while gen');
				});
				if (data.beatmap.difficulty_rating > 10) {
					for (let i = 0; i < 10; i++) {
						ctx.drawImage(star, 40 + 33 * i, 420, 28, 27);
					}
				} else {
					for (var i = 0; i < Math.floor(data.beatmap.difficulty_rating); i++) {
						ctx.drawImage(star, 40 + 33 * i, 420, 28, 27);
					}
					let lastStarSize = (data.beatmap.difficulty_rating - Math.floor(data.beatmap.difficulty_rating));
					let minSize = 0.5;
					let multiplier = ((1 - minSize) + (minSize * lastStarSize));
					ctx.drawImage(star, 40 + 33 * (i) + ((28 - (28 * multiplier)) / 2), 420 + ((27 - (27 * multiplier)) / 2), 28 * multiplier, 27 * multiplier);
				}


				// pp for acc
				
				
				//CS / AR /HP / OD / star rate int

				ctx.fillStyle = colour.foreground;
				ctx.strokeStyle = colour.foreground;
				ctx.font = '30px VarelaRound';
				ctx.fillText(Number(data.beatmap.difficulty_rating).toFixed(2), 390, 445);
				ctx.strokeText(Number(data.beatmap.difficulty_rating).toFixed(2), 390, 445);
				ctx.font = '22px VarelaRound';
				ctx.fillText('CS', 41, 459 + 22);
				ctx.strokeText('CS', 41, 459 + 22);
				ctx.fillText('AR', 41, 495 + 22);
				ctx.strokeText('AR', 41, 495 + 22);
				ctx.fillText('HP', 41, 531 + 22);
				ctx.strokeText('HP', 41, 531 + 22);
				ctx.fillText('OD', 41, 567 + 22);
				ctx.strokeText('OD', 41, 567 + 22);
				ctx.fillText(Math.round(data.beatmap.difficulty_rating * 10) / 10, 390, 423 + 22);
				ctx.strokeText(Math.round(data.beatmap.difficulty_rating * 10) / 10, 390, 423 + 22);
				ctx.fillText(data.beatmap.cs, 390, 459 + 22);
				ctx.strokeText(data.beatmap.cs, 390, 459 + 22);
				ctx.fillText(data.beatmap.ar, 390, 495 + 22);
				ctx.strokeText(data.beatmap.ar, 390, 495 + 22);
				ctx.fillText(data.beatmap.drain, 390, 531 + 22);
				ctx.strokeText(data.beatmap.drain, 390, 531 + 22);
				ctx.fillText(data.beatmap.accuracy, 390, 567 + 22);
				ctx.strokeText(data.beatmap.accuracy, 390, 567 + 22);

				ctx.beginPath();
				ctx.fillStyle = colour.foreground + '31';
				format.rect(ctx, 88, 466, 284, 13, 7);
				format.rect(ctx, 88, 504, 284, 13, 7);
				format.rect(ctx, 88, 539, 284, 13, 7);
				format.rect(ctx, 88, 570, 284, 13, 7);
				ctx.beginPath();
				ctx.fillStyle = colour.foreground;
				format.rect(ctx, 88, 466, 28.4 * (data.beatmap.cs > 0 ? data.beatmap.cs : 0.5), 13, 7);
				format.rect(ctx, 88, 504, 28.4 * (data.beatmap.ar > 0 ? data.beatmap.ar : 0.5), 13, 7);
				format.rect(ctx, 88, 539, 28.4 * (data.beatmap.drain > 0 ? data.beatmap.drain : 0.5), 13, 7);
				format.rect(ctx, 88, 570, 28.4 * (data.beatmap.accuracy > 0 ? data.beatmap.accuracy : 0.5), 13, 7);

				try {
					var mapperPfp = await Canvas.loadImage(`https://a.ppy.sh/${data.user_id}`);
				} catch (err) {
					mapperPfp = await Canvas.loadImage('https://osu.ppy.sh/images/layout/avatar-guest.png').catch((err: any) => {
						error.unexpectedError(err, 'Err while gen');
					});

				}
				ctx.save();
				format.rect(ctx, 478, 456, 91, 91, 16);
				ctx.clip();
				ctx.drawImage(mapperPfp, 478, 456, 91, 91);
				ctx.restore();

				ctx.font = '21px VarelaRound';
				ctx.textAlign = 'center';
				ctx.fillText(data.creator, 523, 581);
				ctx.strokeText(data.creator, 523, 581);


				svgFile = fs.readFileSync(path.resolve(__dirname, '../assets/clock.svg'), 'utf8');
				svgFile = svgFile.replace(/fill="[#\.a-zA-Z0-9]+"/g, `fill="${colour.foreground}"`);
				let clock = await Canvas.loadImage(Buffer.from(svgFile)).catch((err: any) => {
					error.unexpectedError(err, 'Err while gen');
				});

				ctx.drawImage(clock, 455, 375, 38, 38);

				svgFile = fs.readFileSync(path.resolve(__dirname, '../assets/times.svg'), 'utf8');
				svgFile = svgFile.replace(/fill="[#\.a-zA-Z0-9]+"/g, `fill="${colour.foreground}"`);
				let times = await Canvas.loadImage(Buffer.from(svgFile)).catch((err: any) => {
					error.unexpectedError(err, 'Err while gen');
				});

				ctx.drawImage(times, 600, 380, 28, 28);

				svgFile = fs.readFileSync(path.resolve(__dirname, '../assets/drum.svg'), 'utf8');
				svgFile = svgFile.replace(/fill="[#\.a-zA-Z0-9]+"/g, `fill="${colour.foreground}"`);
				let drum = await Canvas.loadImage(Buffer.from(svgFile)).catch((err: any) => {
					error.unexpectedError(err, 'Err while gen');
				});

				ctx.drawImage(drum, 756, 375, 40, 35);

				var time = Math.floor(data.beatmap.total_length / 60) + ':' + (data.beatmap.total_length % 60 < 10 ? '0' + (data.beatmap.total_length % 60) : data.beatmap.total_length % 60);
				
				try {
					var bpm = beatmap.getVariableBPM(data.bpm, osuContent.bpmMin, osuContent.bpmMax, osuContent.timingPoints, data.beatmap.total_length) + ' bpm';
				} catch {
					bpm = data.bpm + ' bpm';
				}

				ctx.textAlign = 'left';
				ctx.font = '27px VarelaRound';
				ctx.fillText(time, 505, 374 + 30);
				ctx.strokeText(time, 505, 374 + 30);
				ctx.fillText((data.beatmap.max_combo ? data.beatmap.max_combo : '-') + 'x', 642, 374 + 30);
				ctx.strokeText((data.beatmap.max_combo ? data.beatmap.max_combo : '-') + 'x', 642, 374 + 30);
				ctx.fillText(bpm, 816, 374 + 30);
				ctx.strokeText(bpm, 816, 374 + 30);

				ctx.textAlign = 'left';
				ctx.font = '26px VarelaRound';
				ctx.fillText(data.beatmap.version, 629, 416 + 26);
				ctx.strokeText(data.beatmap.version, 629, 416 + 26);


				var compare = (a: any, b: any) => {
					if (parseFloat(a.difficulty_rating) > parseFloat(b.difficulty_rating)) {
						return 1;
					} else {
						return -1;
					}
				};
				data.beatmaps.sort(compare);

				for (i = 0; i < data.beatmaps.length; i++) {
					ctx.globalAlpha = 0.3;
					if (data.beatmaps[i].difficulty_rating == data.beatmap.difficulty_rating) {
						ctx.globalAlpha = 1;
						ctx.beginPath();
						ctx.fillStyle = colour.foreground + '21';
						format.rect(ctx, 630 + ((i % 8) * 50) - 5, 457 + (Math.floor(i / 8) * 50) - 5, 50, 50, 11);
						ctx.fill();
					}
					var icon;
					if (data.beatmaps[i].difficulty_rating < 2) {
						icon = await Canvas.loadImage(path.resolve(__dirname, `../assets/easy_${data.beatmaps[i].mode}.png`)).catch((err: any) => {
							error.unexpectedError(err, 'Err while gen');
						});
					} else if (data.beatmaps[i].difficulty_rating < 2.7) {
						icon = await Canvas.loadImage(path.resolve(__dirname, `../assets/normal_${data.beatmaps[i].mode}.png`)).catch((err: any) => {
							error.unexpectedError(err, 'Err while gen');
						});
					} else if (data.beatmaps[i].difficulty_rating < 4) {
						icon = await Canvas.loadImage(path.resolve(__dirname, `../assets/hard_${data.beatmaps[i].mode}.png`)).catch((err: any) => {
							error.unexpectedError(err, 'Err while gen');
						});
					} else if (data.beatmaps[i].difficulty_rating < 5.3) {
						icon = await Canvas.loadImage(path.resolve(__dirname, `../assets/insane_${data.beatmaps[i].mode}.png`)).catch((err: any) => {
							error.unexpectedError(err, 'Err while gen');
						});
					} else if (data.beatmaps[i].difficulty_rating < 6.5) {
						icon = await Canvas.loadImage(path.resolve(__dirname, `../assets/expert_${data.beatmaps[i].mode}.png`)).catch((err: any) => {
							error.unexpectedError(err, 'Err while gen');
						});
					} else {
						icon = await Canvas.loadImage(path.resolve(__dirname, `../assets/extra_${data.beatmaps[i].mode}.png`)).catch((err: any) => {
							error.unexpectedError(err, 'Err while gen');
						});
					}
					ctx.drawImage(icon, 630 + ((i % 8) * 50), 457 + (Math.floor(i / 8) * 50), 40, 40);
				}
				console.log(`GENERATED BEATMAP CARD : https://osu.ppy.sh/beatmapsets/${data.id}#osu/${data.beatmap.id}`);
				
				
				//const user = await User.findOne({tgId: contx.update.callback_query ? contx.update.callback_query.message.message_id : contx.update.message.from.id})
				
				let keyboard = new InlineKeyboard()
					.text("🎧 | слушать превью", "audio_" + data.id).row()
					.text("🌠 | профиль маппера", "user_" + data.user_id)
				
				/*
				if (user) {
					buttons.push(
						[
							Markup.button.callback("❤️ | лайкнуть карту", "like_" + data.id)
						]
					)
					
				}
				*/
				var ppstr = `\n\n[расчитать pp](https://t.me/okichanbot/calc?startapp=${data.beatmap.id})`
				if (!isOsuSend) {
		  			contx.replyWithPhoto(new InputFile(canvas.toBuffer('image/png')), {caption: `[map link](https://osu.ppy.sh/beatmapsets/${data.id}#osu/${data.beatmap.id})\n[download](https://api.nerinyan.moe/d/${data.id}?nv=1)\n[osudirect](https://oki.nyako.tk/od/${data.id})\n[map preview](https://preview.nerinyan.moe/?b=${data.beatmap.id})\n[donate to dev](https://t.me/donatenyako)${ppstr}\n${Math.random() < 0.3 ? "\n[подпишитесь на канал бота, чтобы первыми узнавать об обновлениях](https://t.me/okiupdates)" : ""}`, reply_to_message_id: contx.update.callback_query ? contx.update.callback_query.message.message_id : contx.message.message_id, parse_mode: "MarkdownV2", reply_markup: keyboard});
				} else {
					contx.sendPhoto(idToSend, new InputFile(canvas.toBuffer('image/png')), {caption: `*отправлено из osu*\n[map link](https://osu.ppy.sh/beatmapsets/${data.id}#osu/${data.beatmap.id})\n[download](https://api.nerinyan.moe/d/${data.id}?nv=1)\n[osudirect](https://oki.nyako.tk/od/${data.id})\n[map preview](https://preview.nerinyan.moe/?b=${data.beatmap.id})\n[donate to dev](https://t.me/donatenyako)${ppstr}\n${Math.random() < 0.3 ? "\n[чтобы быть в курсе всех последних новостей из мира осу можете подписаться на новостник](https://t.me/osunewsru)" : ""}`, parse_mode: "MarkdownV2", reply_markup: keyboard})
				}
				
			});
		}).catch((err : Error) => {error.unexpectedError(err, "Err while send");});

		

}



export {
	generateBeatmap,
	getBeatmapData,
	getBeatmapsetData
};
