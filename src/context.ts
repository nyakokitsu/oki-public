import { ConversationFlavor } from '@grammyjs/conversations';
import type {I18nFlavor} from '@grammyjs/i18n';
import type {Context as BaseContext, SessionFlavor} from 'grammy';
import { EmojiFlavor, emojiParser } from "@grammyjs/emoji";


interface BotConfig {
    botDeveloper: number;
    isDeveloper: boolean;
}
  

  export type Session = {
	page?: number;
};

export type MyContext = BaseContext & SessionFlavor<Session> & I18nFlavor & ConversationFlavor & EmojiFlavor;;