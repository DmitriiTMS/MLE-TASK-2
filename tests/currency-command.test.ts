import { CurrencyCommand } from '../src/commands/currency-command';
import { ITelegramService } from '../src/services/telegram/telegram.interface';
import { ICurrencyService } from '../src/services/currency-service/currency-service.interface';
import { ILogger } from '../src/utils/logger.interface';
import { ITelegramMessage } from '../src/models/types';

describe('CurrencyCommand', () => {
  
    let currencyCommand: CurrencyCommand;
    let mockTelegramService: jest.Mocked<ITelegramService>;
    let mockCurrencyService: jest.Mocked<ICurrencyService>;
    let mockLogger: jest.Mocked<ILogger>;
    let mockMessage: ITelegramMessage;

    beforeEach(() => {
        mockTelegramService = {
            getUpdates: jest.fn(),
            sendMessage: jest.fn().mockResolvedValue(undefined)
        };

        mockCurrencyService = {
            getExchangeRate: jest.fn()
        };

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            formatMessage: jest.fn()
        };

        currencyCommand = new CurrencyCommand(mockLogger, mockCurrencyService);

        mockMessage = {
            message_id: 1,
            from: { id: 123, is_bot: false, first_name: 'Test' },
            chat: { id: 456, type: 'private' },
            date: Date.now(),
            text: '/currency'
        };
    });

    describe('successful scenarios', () => {
        it('should execute currency command and wait for input', async () => {
            await currencyCommand.execute(mockMessage, mockTelegramService);

            expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
                456,
                expect.stringContaining('Введи валютную пару в формате USD-EUR')
            );
            expect(currencyCommand.isWaitingForCurrency(456)).toBe(true);
        });

        it('should handle valid currency pair input', async () => {
            mockMessage.text = 'USD-EUR';
            mockCurrencyService.getExchangeRate.mockResolvedValue(0.85);
            currencyCommand['waitingForCurrency'].set(456, true);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(mockCurrencyService.getExchangeRate).toHaveBeenCalledWith('USD', 'EUR');
            expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
                456,
                'Текущий курс USD к EUR: 0.85.'
            );
            expect(currencyCommand.isWaitingForCurrency(456)).toBe(true);
        });

        it('should reset retry count after successful input', async () => {
            mockMessage.text = 'USD-EUR';
            mockCurrencyService.getExchangeRate.mockResolvedValue(0.85);
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 1);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(currencyCommand['retryCount'].get(456)).toBe(0);
        });
    });

    describe('error scenarios - invalid user input', () => {
        it('should handle invalid currency pair format', async () => {
            mockMessage.text = 'invalid-format';
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 0);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
                456,
                'Неверный формат валютной пары. Пожалуйста, используй формат USD-EUR (три буквы, дефис, три буквы).'
            );
            expect(currencyCommand['retryCount'].get(456)).toBe(1);
        });

        it('should handle empty input', async () => {
            mockMessage.text = '';
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 0);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
                456,
                expect.stringContaining('Неверный формат валютной пары')
            );
        });

        it('should exit waiting mode after max retries', async () => {
            mockMessage.text = 'invalid';
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 1);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(2);
            expect(mockTelegramService.sendMessage).toHaveBeenNthCalledWith(
                1,
                456,
                expect.stringContaining('Неверный формат валютной пары')
            );
            expect(mockTelegramService.sendMessage).toHaveBeenNthCalledWith(
                2,
                456,
                'Слишком много неудачных попыток. Режим валют завершен. Используй /currency чтобы начать заново.'
            );
            expect(currencyCommand.isWaitingForCurrency(456)).toBe(false);
        });
    });

    describe('error scenarios - external service issues', () => {
        it('should handle API connection failure', async () => {
            mockMessage.text = 'USD-EUR';
            const networkError = new Error('fetch failed');
            mockCurrencyService.getExchangeRate.mockRejectedValue(networkError);
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 0);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
                456,
                'Сервис курсов валют временно недоступен. Пожалуйста, попробуй позже.'
            );
        });

        it('should handle currency not found error', async () => {
            mockMessage.text = 'USD-XXX';
            const notFoundError = new Error('Currency XXX not found in rates');
            mockCurrencyService.getExchangeRate.mockRejectedValue(notFoundError);
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 0);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
                456,
                'Указанная валюта не найдена. Проверьте правильность кода валюты (например, USD, EUR, RUB).'
            );
        });

        it('should handle generic API error', async () => {
            mockMessage.text = 'USD-EUR';
            const genericError = new Error('API error');
            mockCurrencyService.getExchangeRate.mockRejectedValue(genericError);
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 0);

            await currencyCommand.handleCurrencyInput(mockMessage, mockTelegramService);

            expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
                456,
                'Ой! Что-то пошло не так. Убедись, что ввел валютную пару в формате USD-EUR, или попробуй позже.'
            );
        });
    });

    describe('shouldExecute', () => {
        it('should return true for /currency command', () => {
            expect(currencyCommand.shouldExecute('/currency')).toBe(true);
            expect(currencyCommand.shouldExecute('/start')).toBe(false);
            expect(currencyCommand.shouldExecute('USD-EUR')).toBe(false);
        });
    });

    describe('stopWaiting', () => {
        it('should stop waiting for currency input', () => {
            currencyCommand['waitingForCurrency'].set(456, true);
            currencyCommand['retryCount'].set(456, 1);

            currencyCommand.stopWaiting(456);

            expect(currencyCommand.isWaitingForCurrency(456)).toBe(false);
            expect(currencyCommand['retryCount'].get(456)).toBeUndefined();
        });
    });
});