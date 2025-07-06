import {bot } from '../index'


export function unexpectedError(err: Error, additionalInfo: string, callback = () => { }) {
	bot.api.sendMessage(-1001949906156, err.toString());
	callback();
	
}