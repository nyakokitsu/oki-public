function isOsuBeatmapSetUrl(url: string): boolean {
    return url.match(/osu\.ppy\.sh\/(beatmapsets\/\d+(#([A-Za-z0-9]+))?\/\d+|s\/\d+)/i) !== null;
}

function isOsuBeatmapUrl(url: string): boolean {
    return url.match(/osu.ppy.sh\/b\/\d+/) !== null;
}
  
function getBeatmapIdFromUrl(url: string): string {
    return url.slice(url.lastIndexOf('/') + 1);
}
  
function getBeatmapSetIdFromUrl(url: string): string {
    return url.slice(url.indexOf('beatmapsets/') + 11 + 1, url.indexOf('#') > -1 ? url.indexOf('#') : url.length);
}
  
function isOsuUserUrl(url: string): boolean {
    return url.match(/osu\.ppy\.sh\/(users|u)\/[0-9A-Za-z_!\?\-\[\]%]+/g) !== null;
}
  
function getUserIdFromUrl(url: string): string {
    var userId = url.match(/(http(s)?:\/\/)?osu.ppy.sh\/(users|u)\/[0-9A-Za-z_!\?\-\[\]%]+/)![0].replace(/(http(s)?:\/\/)?osu.ppy.sh\/(users|u)\//, '');
	if (userId.includes('/')) userId =  userId.slice(0,userId.indexOf('/'));
    return userId
}

const isCommand = (text: string) => {
    return text.match(/((osu!|o!)|\/)(help|settings|me|last|random|rnd|db|best|set)/);
  };

function getCommandFromMessage(command) {
    const regex = /^(o!|osu!|\/)(.*)$/;
    const match = command.match(regex);
    return match[2];
}

export {isOsuBeatmapSetUrl, getBeatmapIdFromUrl, getBeatmapSetIdFromUrl, isOsuUserUrl, getUserIdFromUrl, isCommand, getCommandFromMessage, isOsuBeatmapUrl}