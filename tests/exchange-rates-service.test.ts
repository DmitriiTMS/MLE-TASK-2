import { ExchangeRatesService } from '../src/services/currency-service/exchange-rates-service';
import { IConfig } from '../src/config/config.interface';
import { ILogger } from '../src/utils/logger.interface';
import { IHttpClient } from '../src/api/http-client.interface';
import { IExchangeRateResponse } from '../src/models/types';

describe('ExchangeRatesService', () => {
    const MOCK_API_URL = 'https://api.exchangerate-api.com/v4/latest';

    let exchangeRatesService: ExchangeRatesService;
    let mockConfig: jest.Mocked<IConfig>;
    let mockLogger: jest.Mocked<ILogger>;
    let mockHttpClient: jest.Mocked<IHttpClient>;

    beforeEach(() => {
        mockConfig = {
            getExchangeRatesApiUrl: jest.fn().mockReturnValue(MOCK_API_URL),
            getTelegramApiUrl: jest.fn(),
            getTelegramBotToken: jest.fn()
        };

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            formatMessage: jest.fn()
        };

        mockHttpClient = {
            get: jest.fn(),
            post: jest.fn()
        };

        exchangeRatesService = new ExchangeRatesService(
            mockConfig,
            mockLogger,
            mockHttpClient
        );
    });

    describe('successful scenarios', () => {
        it('should return exchange rate for valid currency pair', async () => {
            const mockResponse: IExchangeRateResponse = {
                base: 'USD',
                rates: { EUR: 0.85, GBP: 0.75, JPY: 110.5 },
                date: '2024-01-01'
            };

            mockHttpClient.get.mockResolvedValue(mockResponse);

            const rate = await exchangeRatesService.getExchangeRate('USD', 'EUR');

            expect(rate).toBe(0.85);
            expect(mockHttpClient.get).toHaveBeenCalledWith(`${MOCK_API_URL}/USD`);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Fetching exchange rates from API',
                expect.objectContaining({ from: 'USD', to: 'EUR' })
            );
        });

        it('should handle different currency pairs', async () => {
            const mockResponse: IExchangeRateResponse = {
                base: 'EUR',
                rates: { USD: 1.18, GBP: 0.86, JPY: 130.2 },
                date: '2024-01-01'
            };

            mockHttpClient.get.mockResolvedValue(mockResponse);

            const rate = await exchangeRatesService.getExchangeRate('EUR', 'USD');

            expect(rate).toBe(1.18);
            expect(mockHttpClient.get).toHaveBeenCalledWith(`${MOCK_API_URL}/EUR`);
        });
    });

    describe('error scenarios - API connection issues', () => {
        it('should handle network error', async () => {
            const networkError = new Error('Network error');
            mockHttpClient.get.mockRejectedValue(networkError);

            await expect(exchangeRatesService.getExchangeRate('USD', 'EUR'))
                .rejects.toThrow('Network error');

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error in getExchangeRate',
                expect.objectContaining({
                    message: 'Network error',
                    from: 'USD',
                    to: 'EUR'
                })
            );
        });

        it('should handle timeout error', async () => {
            const timeoutError = new Error('timeout of 10000ms exceeded');
            mockHttpClient.get.mockRejectedValue(timeoutError);

            await expect(exchangeRatesService.getExchangeRate('USD', 'EUR'))
                .rejects.toThrow('timeout of 10000ms exceeded');
        });
    });

    describe('error scenarios - invalid currency', () => {
        it('should throw error when target currency not found', async () => {
            const mockResponse: IExchangeRateResponse = {
                base: 'USD',
                rates: { EUR: 0.85, GBP: 0.75 },
                date: '2024-01-01'
            };

            mockHttpClient.get.mockResolvedValue(mockResponse);

            await expect(exchangeRatesService.getExchangeRate('USD', 'XXX'))
                .rejects.toThrow('Currency XXX not found in rates');

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Currency XXX not found in rates',
                { availableRates: ['EUR', 'GBP'] }
            );
        });

        it('should handle empty rates response', async () => {
            const mockResponse: IExchangeRateResponse = {
                base: 'USD',
                rates: {},
                date: '2024-01-01'
            };

            mockHttpClient.get.mockResolvedValue(mockResponse);

            await expect(exchangeRatesService.getExchangeRate('USD', 'EUR'))
                .rejects.toThrow('Currency EUR not found in rates');
        });
    });

    describe('error scenarios - malformed response', () => {
        it('should handle malformed API response', async () => {
            mockHttpClient.get.mockRejectedValue(new Error('Invalid JSON'));

            await expect(exchangeRatesService.getExchangeRate('USD', 'EUR'))
                .rejects.toThrow('Invalid JSON');
        });
    });
});