import { IMessageHandler } from './message-handler.interface';
import { ITelegramMessage } from '../models/types';
import { CommandFactory } from '../commands/command-factory';
import { ILogger } from '../utils/logger.interface';
import { ITelegramService } from '../services/telegram/telegram.interface';
import { CurrencyCommand } from '../commands/currency-command';


export class MessageHandler implements IMessageHandler {
    private currencyCommand: CurrencyCommand;

    constructor(
        private readonly logger: ILogger,
        private readonly commandFactory: CommandFactory,
        private readonly telegramService: ITelegramService
    ) {
        this.currencyCommand = commandFactory.getCurrencyCommand();
    }

    async handleMessage(message: ITelegramMessage): Promise<void> {
        const chatId = message.chat.id;
        const text = message.text || '';

        this.logger.info(`Handling message from chat ${chatId}`, { text });

        try {
            const command = this.commandFactory.findCommand(text);
            if (command) {
                await command.execute(message, this.telegramService);
                return;
            }
            if (this.currencyCommand.isWaitingForCurrency(chatId)) {
                await this.currencyCommand.handleCurrencyInput(message, this.telegramService);
            } else {
                if (text.trim()) {
                    await this.telegramService.sendMessage(
                        chatId,
                        'Используй /currency чтобы начать получать курсы валют, или /start для списка команд.'
                    );
                }
                this.logger.info(`Message from chat ${chatId} ignored - not in currency mode`, { text });
            }
        } catch (error) {
            this.logger.error(`Error handling message from chat ${chatId}`, error);
            throw error;
        }
    }
}