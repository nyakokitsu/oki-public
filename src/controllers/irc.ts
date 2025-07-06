import { Api } from "grammy";
import {User} from '../db/models/user'
import { getBeatmapIdFromUrl, isOsuBeatmapUrl } from "../utils/middleware";
import { getBeatmapData } from "./map";
import { fetchUserInfo, fetchRecentScore } from "../utils/osuAPIv2";
import axios from "axios";

import CyrillicToTranslit from 'cyrillic-to-translit-js';

const cyrillicToTranslit = CyrillicToTranslit();
const Banchojs = require("bancho.js");
const client = new Banchojs.BanchoClient({ username: "Tokamona", password: "TOKENREMOVED", apiKey: process.env.osuAPI });


async function connectAndRunIRC(ctx: Api) {
    await client.connect()
    console.log(new Date(), `ircbot started`);
    client.on("PM", async (message) => {
        await processMessagePM(message, ctx)
    });
}

async function processMessagePM(message, ctx) {
    const user = await message.user.fetchFromAPI()
    const data = await User.findOne({osuId: user.id})

    //console.log(`${user.username}: ${message.message}`)

    const prefix = "!"
	if (!message.message.startsWith(prefix)) {
        const beatmapId = getBeatmapIdFromUrl(message.message).split(" ")[0]
        if (message.message.includes("is listening to") && isOsuBeatmapUrl(message.message.replace("is listening to"))) {
            if (data.tgId) {
                message.user.sendMessage("sent to Telegram.")
                return getBeatmapData(ctx, beatmapId, true, data.tgId)
            } else {
                return message.user.sendMessage("ERR: Account must be linked to bot. Open [https://oki.nyako.tk bot] and link osu account via osu!link command.")
            }
            
        }
    };
	const args = message.message.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

    if (command === "info") {
        return message.user.sendMessage("Hey! Thanks for using Oki-Chan irc bot. loveyou. [https://oki.nyako.tk bot link]")
    } else if (command === "help") {
        return message.user.sendMessage("Read irc bot commands list [https://oki.nyako.tk/help/irc here].")
    } else if (command === "medal") {
        const userData = await fetchUserInfo(user.id)
        const achievements = userData.user_achievements
        if (achievements.length > 0) {
            const { data } = await axios.get("https://osekai.net/medals/api/medals.php")
            const medal = data.find(x => x.MedalID === achievements[0].achievement_id)
            const medalURL = encodeURI(`https://osekai.net/medals/?medal=${medal.Name}`)
            return message.user.sendMessage(`Medal Name: ${medal.Name} | Description: "${medal.Description}" | Solution: ${medal.Solution} | Rarity: ${parseFloat(medal.Rarity).toFixed(1)}% | Stable Only: ${medal.Lazer == 0 ? "Yes" : "No"} | [${medalURL} osekai]`) // [https://oku.nyako.tk/medals/${medal.Id} oki]
        } else {
            return message.user.sendMessage("ERR: Not found last medals =(")
        }
    } else if (command === "last") {
        const score = await fetchRecentScore(user.id)
        if (score.length > 0) {
            const scoreElement = score[0]
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
            message.user.sendMessage(`Last score info :: Played on ${scoreElement.beatmap.status} map [https://osu.ppy.sh/s/${scoreElement.beatmapset.id} ${scoreElement.beatmapset.title_unicode}] mapped by [https://osu.ppy.sh/users/${scoreElement.beatmapset.user_id} ${scoreElement.beatmapset.creator}] on diff [https://osu.ppy.sh/b/${scoreElement.beatmap.id} ${scoreElement.beatmap.version}] :: `) // [https://oku.nyako.tk/medals/${medal.Id} oki]
            message.user.sendMessage(`Hits: 300: ${count300} | 100:${count100} | 50: ${count50} | ❌: ${miss} :: Passed on ${scoreElement.rank} with acc ${Math.floor(scoreElement.accuracy * 1000) / 10}%  ${mods.length > 0 ? "+" : ""}${mods.join("")} :: ${scoreElement.pp != null ? "Earned "+Math.round(scoreElement.pp)+"pp": "pp not earned"}`)
            
        } else {
            message.user.sendMessage("ERR: Not found last records =(")
        }
	return;
    } else if (command === "anekdot") {
        // http://rzhunemogu.ru/RandJSON.aspx?CType=1
        /*const { data } = await axios.get("http://rzhunemogu.ru/RandJSON.aspx?CType=1")
        console.log(data)*/
        return message.user.sendMessage("anekdoty ne rabotayt =(")

    }


    
    
}

export {connectAndRunIRC}
