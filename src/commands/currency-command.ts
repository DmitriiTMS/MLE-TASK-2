import { ICommand } from './command.interface';
import { ITelegramMessage } from '../models/types';
import { ILogger } from '../utils/logger.interface';
import { ITelegramService } from '../services/telegram/telegram.interface';
import { ICurrencyService } from '../services/currency-service.interface.ts/currency-service.interface';
import { CurrencyPair } from '../models/currency-pair';

export class CurrencyCommand implements ICommand {
  private waitingForCurrency: Map<number, boolean> = new Map();
  private retryCount: Map<number, number> = new Map();


  constructor(
    private readonly logger: ILogger,
    private readonly currencyService: ICurrencyService,

) {}

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

    }
  }

  isWaitingForCurrency(chatId: number): boolean {
    return this.waitingForCurrency.get(chatId) || false;
  }
}