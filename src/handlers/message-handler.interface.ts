import { ITelegramMessage } from '../models/types';

export interface IMessageHandler {
    handleMessage(message: ITelegramMessage): Promise<void>
}