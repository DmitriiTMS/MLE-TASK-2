import { ICommand } from './command.interface';
import { ITelegramMessage } from '../models/types';
import { ILogger } from '../utils/logger.interface';
import { ITelegramService } from '../services/telegram/telegram.interface';
import { ICurrencyService } from '../services/currency-service/currency-service.interface';
import { CurrencyPair } from '../models/currency-pair';

export class CurrencyCommand implements ICommand {
  private waitingForCurrency: Map<number, boolean> = new Map();
  private retryCount: Map<number, number> = new Map();
  private readonly MAX_RETRIES = 2;

  constructor(
    private readonly logger: ILogger,
    private readonly currencyService: ICurrencyService,

  ) { }

  shouldExecute(commandText: string): boolean {
    return commandText === '/currency';
  }

  async execute(message: ITelegramMessage, telegramService: ITelegramService): Promise<void> {
    const chatId = message.chat.id;

    this.logger.info(`Executing currency command for user ${message.from.id}`, { chatId });

    try {
      this.waitingForCurrency.set(chatId, true);
      this.retryCount.set(chatId, 0);
      await telegramService.sendMessage(
        chatId,
        'Введи валютную пару в формате USD-EUR, чтобы узнать курс обмена.\n\nДля выхода из режима валют используй /stop или /start'
      );
      this.logger.info(`Currency command executed successfully for chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Failed to execute currency command for chat ${chatId}`, error);
      throw error;
    }
  }

  async handleCurrencyInput(message: ITelegramMessage, telegramService: ITelegramService): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text || '';
    const currentRetryCount = this.retryCount.get(chatId) || 0;

    this.logger.info(`Handling currency input`, { chatId, text, retryCount: currentRetryCount });

    try {
      const currencyPair = CurrencyPair.parse(text);

      if (!currencyPair) {
        const errorMessage = 'Неверный формат валютной пары. Пожалуйста, используй формат USD-EUR (три буквы, дефис, три буквы).';
        await telegramService.sendMessage(chatId, errorMessage);
        this.logger.info(`Invalid currency format`, { chatId, text });
        await this.handleError(chatId, telegramService);
        return;
      }

      const rate = await this.currencyService.getExchangeRate(
        currencyPair.from,
        currencyPair.to
      );

      const successMessage = `Текущий курс ${currencyPair.from} к ${currencyPair.to}: ${rate}.`;
      await telegramService.sendMessage(chatId, successMessage);

      this.logger.info(`Currency rate sent successfully`, {
        chatId,
        from: currencyPair.from,
        to: currencyPair.to,
        rate
      });

      this.retryCount.set(chatId, 0);

      await telegramService.sendMessage(
        chatId,
        'Можешь ввести другую валютную пару или используй /stop для выхода.'
      );

    } catch (error) {
      this.logger.error(`Error handling currency input for chat ${chatId}`, error);

      let userErrorMessage = '';

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('Currency')) {
          userErrorMessage = 'Указанная валюта не найдена. Проверьте правильность кода валюты (например, USD, EUR, RUB).';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          userErrorMessage = 'Сервис курсов валют временно недоступен. Пожалуйста, попробуй позже.';
        } else {
          userErrorMessage = 'Ой! Что-то пошло не так. Убедись, что ввел валютную пару в формате USD-EUR, или попробуй позже.';
        }
      } else {
        userErrorMessage = 'Ой! Что-то пошло не так. Убедись, что ввел валютную пару в формате USD-EUR, или попробуй позже.';
      }

      await telegramService.sendMessage(chatId, userErrorMessage);
      await this.handleError(chatId, telegramService);
    }
  }

  private async handleError(chatId: number, telegramService: ITelegramService): Promise<void> {
    const currentRetryCount = this.retryCount.get(chatId) || 0;
    const newRetryCount = currentRetryCount + 1;

    if (newRetryCount >= this.MAX_RETRIES) {
      this.logger.info(`Too many errors for chat ${chatId}, exiting currency mode`);
      await telegramService.sendMessage(
        chatId,
        'Слишком много неудачных попыток. Режим валют завершен. Используй /currency чтобы начать заново.'
      );
      this.clearWaitingState(chatId);
    } else {
      this.retryCount.set(chatId, newRetryCount);
      this.logger.info(`Retry ${newRetryCount}/${this.MAX_RETRIES} for chat ${chatId}`);
    }
  }

  private clearWaitingState(chatId: number): void {
    this.waitingForCurrency.delete(chatId);
    this.retryCount.delete(chatId);
  }

  stopWaiting(chatId: number): void {
    if (this.waitingForCurrency.has(chatId)) {
      this.clearWaitingState(chatId);
      this.logger.info(`Stopped waiting for currency input for chat ${chatId}`);
    }
  }

  isWaitingForCurrency(chatId: number): boolean {
    return this.waitingForCurrency.get(chatId) || false;
  }
}