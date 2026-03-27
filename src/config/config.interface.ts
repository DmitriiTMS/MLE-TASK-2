export interface IConfig {
    telegramApiUrl: string;
    telegramBotToken: string;
    exchangeRatesApiUrl: string;

    getTelegramApiUrl(): string
    getTelegramBotToken(): string
    getExchangeRatesApiUrl(): string
}