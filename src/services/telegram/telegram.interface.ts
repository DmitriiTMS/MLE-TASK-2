import { ITelegramUpdate } from '../../models/types';

export interface ITelegramService {
    getUpdates(offset?: number): Promise<ITelegramUpdate[]>,
    sendMessage(chatId: number, text: string): Promise<void>
}