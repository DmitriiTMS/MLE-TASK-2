import { TelegramUpdate } from '../../models/types';

export interface ITelegramService {
    getUpdates(offset?: number): Promise<TelegramUpdate[]>,
    sendMessage(chatId: number, text: string): Promise<void>
}