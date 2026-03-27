import { ICommand } from './command.interface';
import { ITelegramMessage } from '../models/types';
import { ITelegramService } from '../services/telegram/telegram.interface';
import { ILogger } from '../utils/logger.interface';

export class StartCommand implements ICommand {

    constructor(private readonly logger: ILogger) { }

    private readonly welcomeMessage = `Привет! Я помогу тебе узнать текущие курсы валют.

Доступные команды:
/currency - Начать получение курсов валют
/stop - Выйти из режима получения курсов
/start - Показать это сообщение

После ввода /currency ты можешь вводить валютные пары в формате USD-EUR, и я буду показывать текущий курс.`;

    shouldExecute(commandText: string): boolean {
        return commandText === '/start';
    }

    async execute(message: ITelegramMessage, telegramService: ITelegramService): Promise<void> {
        const chatId = message.chat.id;

        this.logger.info(`Executing start command for user ${message.from.id}`, { chatId });

        try {
            await telegramService.sendMessage(chatId, this.welcomeMessage);
             this.logger.info(`Start command executed successfully for chat ${chatId}`);
        } catch (error) {
             this.logger.error(`Failed to execute start command for chat ${chatId}`, error);
            throw error;
        }
    }
}