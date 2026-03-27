import { ITelegramMessage } from '../models/types';
import { ITelegramService } from '../services/telegram/telegram.interface';


export interface ICommand {
  execute(message: ITelegramMessage, telegramService: ITelegramService): Promise<void>;
  shouldExecute(commandText: string): boolean;
}