import { ICommand } from './command.interface';
import { ITelegramMessage } from '../models/types';
import { CurrencyCommand } from './currency-command';
import { ITelegramService } from '../services/telegram/telegram.interface';
import { ILogger } from '../utils/logger.interface';

export class StopCommand implements ICommand {
    constructor(
        private readonly logger: ILogger,
        private readonly currencyCommand: CurrencyCommand
    ) { }

    shouldExecute(commandText: string): boolean {
        return commandText === '/stop';
    }

    async execute(message: ITelegramMessage, telegramService: ITelegramService): Promise<void> {
        const chatId = message.chat.id;

        this.logger.info(`Executing stop command for user ${message.from.id}`, { chatId });

        try {
            if (this.currencyCommand.isWaitingForCurrency(chatId)) {
                this.currencyCommand.stopWaiting(chatId);
                await telegramService.sendMessage(
                    chatId,
                    'Режим получения курсов валют завершен. Используй /currency чтобы начать снова или /start для списка команд.'
                );
            } else {
                await telegramService.sendMessage(
                    chatId,
                    'Вы не находитесь в режиме получения курсов валют. Используй /currency чтобы начать.'
                );
            }
            this.logger.info(`Stop command executed successfully for chat ${chatId}`);
        } catch (error) {
            this.logger.error(`Failed to execute stop command for chat ${chatId}`, error);
            throw error;
        }
    }
}