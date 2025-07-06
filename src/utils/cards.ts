const { GlobalFonts, createCanvas, loadImage } = require('@napi-rs/canvas');
import { time } from 'console';
import * as format from './format';
import { fetchRecentScores, fetchBestScores } from './osuAPIv2'
const fs = require('fs');
const { join } = require('path')
const path = require('path')
import { timeSince } from './utils';
import { BeatmapCalculator } from '@kionell/osu-pp-calculator'
var countryCodes = require('../assets/country_codes.json');


const beatmapCalculator = new BeatmapCalculator();

GlobalFonts.registerFromPath(join(__dirname, '..', 'assets', 'Torus.ttf'), 'Torus');
GlobalFonts.registerFromPath(join(__dirname, '..', 'assets', 'Mulish.ttf'), 'Mulish');



export async function scoresCard(arr: any, type: Boolean) {

    var canvas = createCanvas(1200, 450);
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = "#2a2226";
    format.rect(ctx, 0, 0, canvas.width, canvas.height, 0);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '50px Torus';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${type ? "last": "best"} scores`, 40, 60);

    

    
    let startpos = 90
    let textpos = 113
    let diffpos = 130
    let between = 60

    ctx.textAlign = 'left';
    ctx.font = '32px Mulish';
    ctx.fillStyle = "rgb(163, 143, 152)";
    ctx.fillText(`юзера ${arr[0].user.username} на момент ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 340, 60);

    for (let item of arr) {
        
    // Score block
    ctx.beginPath();
    ctx.fillStyle = "hsl(333, 10%, 30%);";
    ctx.fill();
    format.rect(ctx, 45, startpos, (canvas.width - (45 * 2)), 52, 10);
    
    // Rank icon
    const image = await loadImage(path.resolve(__dirname, `../assets/grade_${item.rank.toLowerCase().replace("x", "ss")}.png`))
    ctx.drawImage(image, 57, startpos + 12, 49, 25);

    // Title
    ctx.textAlign = 'left';
    ctx.font = '20px Mulish';
    ctx.fillStyle = "#ffffff";
    ctx.fillText(item.beatmapset.title, 120, textpos);

    // Diff
    const diffname = item.beatmap.version
    ctx.textAlign = 'left';
    ctx.font = '15px Torus';
    ctx.fillStyle = "rgb(255, 204, 34)";
    ctx.fillText(diffname, 120, diffpos);

    // Date
    ctx.textAlign = 'left';
    ctx.font = '15px Mulish';
    ctx.fillStyle = "rgb(163, 143, 152);";
    ctx.fillText(timeSince(new Date(item["ended_at"])), diffname.length > 15 ? ((diffname.length - 15) * 10) + 260 : 260, diffpos);

    
    // pp block
    ctx.fillStyle = '#46393f';
    format.rect(ctx, 1030, startpos, 125, 52, 10); // adjust the size and radius as needed
    ctx.fill();

    


    // PP 
    const result = await beatmapCalculator.calculate({
        beatmapId: item.beatmap.id,
        mods: item.mods.join(''),
        accuracy: [100],
        strains: false
    });

    ctx.textAlign = 'left';
    ctx.font = 'bold 20px Torus';
    ctx.fillStyle = "hsl(333, 100%, 70%);";
    ctx.fillText(item.beatmap.status != "loved" ? `${Math.round(item.pp)} pp` : "loved", 1050, startpos + 20);

    ctx.textAlign = 'left';
    ctx.font = 'italic 20px Torus';
    ctx.fillStyle = "hsl(333, 100%, 70%);";
    ctx.fillText(`/ ${Math.round(result.performance[0].totalPerformance)} pp`, 1070, startpos + 45);
    
    //console.log(item["mods"])
    if (item["mods"].length == 0) {
        const image = await loadImage(path.resolve(__dirname, `../assets/mods/nomod.png`))
        ctx.drawImage(image, 970, startpos + 12, 46.5, 33);
    } else {
        let startmods = 970

        for (let i = 0; i < item["mods"].length; ++i) {
            
                const image = await loadImage(path.resolve(__dirname, `../assets/mods/${item["mods"][i]["acronym"]}.png`))
                ctx.drawImage(image, startmods, startpos + 12, 46.5, 33);
                startmods = startmods - 50
        }
    }
    

    startpos = startpos + between
    textpos = textpos + between
    diffpos = diffpos + between 
    }
    

    /*
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(30, 26);
    ctx.lineTo(0, 52);
    ctx.closePath();
    ctx.fillStyle = 'hsl(333, 10%, 30%)';    
    ctx.fill();*/


    return canvas.toBuffer("image/png");
}

async function profiles()  {
    var canvas = createCanvas(1200, 624);
    var ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.fillStyle = "#2a2226";
    format.rect(ctx, 0, 0, canvas.width, canvas.height, 0);
    ctx.fill();
    var uid = 23325778;


    // A     /     B
    // ( if B's stats better)
    // Fill color #46393f
    // BG color  #2a2226
    ctx.beginPath();
    ctx.moveTo(620, 0);
    ctx.lineTo(560, 624);
    ctx.lineTo(1200, 624);
    ctx.lineTo(1200, 0);
    ctx.closePath();
    ctx.fillStyle = '#46393f';    
    ctx.fill();

    // A     \     B
    // ( if A's stats better)
    // Fill color #2a2226
    // BG color #46393f
    /*ctx.beginPath();
    ctx.moveTo(490, 0);
    ctx.lineTo(550, 624);
    ctx.lineTo(1200, 624);
    ctx.lineTo(1200, 0);
    ctx.closePath();
    ctx.fillStyle = '#46393f';    
    ctx.fill();*/

    var userCoverUrlFirst = `https://assets.ppy.sh/user-profile-covers/23325778/3d291cba6fb840b435164a79a7c54c4e052b6142f5d40eb31a3d981c4d95eb43.jpeg`;
    var userCoverFirst;
    try {
        userCoverFirst = await loadImage(userCoverUrlFirst);
    } catch (err) {
        userCoverFirst = await loadImage('https://assets.ppy.sh/user-profile-covers/23325778/3d291cba6fb840b435164a79a7c54c4e052b6142f5d40eb31a3d981c4d95eb43.jpeg');
    }
    
    format.rect(ctx, 30, 30, 450, 174, 20);
    ctx.clip();

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.drawImage(userCoverFirst, -10, 20, 540, 144);
    ctx.restore();


    ctx.font = '40px VarelaRound';
    ctx.fillStyle = "#ffffff";
    let countryFirst = countryCodes["RU"];
    var flagFirst = await loadImage(`https://osu.ppy.sh/images/flags/${"RU"}.png`);
    ctx.drawImage(flagFirst, 170, 100, 60, 40);
    ctx.fillText(countryFirst, 240, 137);

    ctx.font = '57px VarelaRound';
    ctx.fillText('#' + format.number(parseInt("200000") || 0), 50, 200);


    ctx.textAlign = 'left';
    ctx.font = '50px Torus';
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Tokamona", 160, 85);


    // 290х120
    var userPictureUrlFirst = `https://a.ppy.sh/${uid}?${Date.now().toString()}`;
    try {
    var userPictureFirst = await loadImage(userPictureUrlFirst);
    } catch (err) {
        userPictureFirst = await loadImage('https://osu.ppy.sh/images/layout/avatar-guest.png');
    }
    format.rect(ctx, 50, 45, 100, 100, 10);
    ctx.clip();

    var scale = Math.max(280 / userPictureFirst.width, 280 / userPictureFirst.height);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 70;
    ctx.drawImage(userPictureFirst, 50, 45, 100 * scale, 100 * scale);
    ctx.restore();

    ////////////////////////////////////////////////

    var userCoverUrlTwo = `https://assets.ppy.sh/user-profile-covers/23325778/1a62868a36253fa5d71f2a34d7235bf7b52a1c68ee87316133a6bdd19a08d458.jpeg`;
    var userCoverTwo;
    try {
        userCoverTwo = await loadImage(userCoverUrlTwo);
    } catch (err) {
        userCoverTwo = await loadImage('https://assets.ppy.sh/user-profile-covers/23325778/3d291cba6fb840b435164a79a7c54c4e052b6142f5d40eb31a3d981c4d95eb43.jpeg');
    }
    ctx.fillStyle = '#46393f'; 
    format.rect(ctx, 1200-480, 30, 450, 174, 20);
    ctx.clip();

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.drawImage(userCoverTwo, 1200-490, 20, 540, 144);
    ctx.restore();


    ctx.font = '40px VarelaRound';
    ctx.fillStyle = "#ffffff";
    let countryTwo = countryCodes["RU"];
    var flagTwo = await loadImage(`https://osu.ppy.sh/images/flags/${"RU"}.png`);
    ctx.drawImage(flagTwo, 1200-170, 100, 60, 40);
    ctx.fillText(countryTwo, 1200-240, 137);

    ctx.font = '57px VarelaRound';
    ctx.fillText('#' + format.number(parseInt("200000") || 0), 50, 200);


    ctx.textAlign = 'left';
    ctx.font = '50px Torus';
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Tokamona", 1200-160, 85);


    // 290х120
    var userPictureUrlTwo = `https://a.ppy.sh/${uid}?${Date.now().toString()}`;
    try {
    var userPictureTwo = await loadImage(userPictureUrlTwo);
    } catch (err) {
        userPictureTwo = await loadImage('https://osu.ppy.sh/images/layout/avatar-guest.png');
    }
    format.rect(ctx, 1200-50, 45, 100, 100, 10);
    ctx.clip();

    var scale = Math.max(280 / userPictureTwo.width, 280 / userPictureTwo.height);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 70;
    ctx.drawImage(userPictureTwo, 1200-50, 45, 100 * scale, 100 * scale);
    ctx.restore();

    



    fs.writeFileSync('img.png', canvas.toBuffer("image/png"));
    return;
}
