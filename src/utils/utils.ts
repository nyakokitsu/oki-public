import * as error from './error';

const axios = require('axios');

export function checkUser(user : string, serverType = 0): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		if (serverType == 0) {
			axios.get(`https://osu.ppy.sh/api/get_user?k=${process.env.osuAPI}&u=${user}`)
				.then((res: any) => {
					if (res.statusCode == 401) return reject(new Error('Unauthorised error. possibly: No valid API key was provided'));
					if (res.data.length == 0) return reject(new Error( 'No user with the specified username/user id was found'));
					else return resolve(String(res.data[0].user_id));
				}).catch((err : Error) => {error.unexpectedError(err, `While running checkUser() : ${user} : ${serverType}`);});
		} else if (serverType == 1) {
			axios.get(`https://api.gatari.pw/users/get?u=${user}`)
				.then((res: any) => {
					if (res.data.users.length == 0) return reject(new Error( 'No user with the specified username/user id was found'));
					else return resolve(String(res.data.users[0].id));
				}).catch((err : Error) => {error.unexpectedError(err, `While running checkUser() : ${user} : ${serverType}`);});
		} else if (serverType == 2) {
			axios.get(`https://akatsuki.pw/api/v1/users?name=${user}`)
				.then((res: any) => {
					if (res.data.code == 404) return reject(new Error( 'No user with the specified username/user id was found'));
					else return resolve(String(res.data.id));
				}).catch(() => {reject(new Error( 'No user with the specified username/user id was found'));});
		} else {
			return reject(new Error('Invalid server type'));
		}
	});
}

export function renameKey(object : any, oldKey : string, newKey : string) {
	if (oldKey === newKey) return object;

	if (Object.prototype.hasOwnProperty.call(object, oldKey)) {
		object[newKey] = object[oldKey];
		delete object[oldKey];
	}

	return object;
}

export function arrayBasedSorting(array : Array<any>, order : Array<any>, key : string) {

	array.sort((a : any, b : any) => {
		var A = a[key];
		var B = b[key];

		if (order.indexOf(A) > order.indexOf(B)) {
			return 1;
		} else {
			return -1;
		}
	});

	return array;
	
}

export function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
}

export function timeSince(date) {

	var seconds = Math.floor((Number(new Date()) - date) / 1000);
  
	var interval = seconds / 31536000;
  
	if (interval > 1) {
	  return Math.floor(interval) + " года назад";
	}
	interval = seconds / 2592000;
	if (interval > 1) {
	  return Math.floor(interval) + ` месяц${(Math.floor(interval) > 1 && Math.floor(interval) < 5) ? "а": ""}${(Math.floor(interval) > 4) ? "ев": ""} назад`;
	}
	interval = seconds / 86400;
	if (interval > 1) {
	  return Math.floor(interval) + ` ${Math.floor(interval) == 1 ? "день" : "дня"} назад`;
	}
	interval = seconds / 3600;
	if (interval > 1) {
	  return Math.floor(interval) + ` час${(Math.floor(interval) > 1 && Math.floor(interval) < 5) ? "а": ""}${(Math.floor(interval) > 4 && Math.floor(interval) < 21) ? "ов": ""}${(Math.floor(interval) > 20) ? "а": ""} назад`;
	}
	interval = seconds / 60;
	if (interval > 1) {
	  return Math.floor(interval) + ` минут${Math.floor(interval) == 1 ? "у" : ""}${Math.floor(interval) > 1 && Math.floor(interval) < 5 ? "ы" : ""} назад`;
	}
	return Math.floor(seconds) + " секунд назад";
  }