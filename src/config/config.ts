import dotenv from 'dotenv';
import { IConfig } from './config.interface';

dotenv.config();

export class Config implements IConfig {
    public readonly telegramBotToken: string;
    public readonly exchangeRatesApiUrl: string;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const apiUrl = process.env.EXCHANGE_RATES_API_URL;

        if (!token) {
            throw new Error('TELEGRAM_BOT_TOKEN is required');
        }

        if (!apiUrl) {
            throw new Error('EXCHANGE_RATES_API_URL is required');
        }

        this.telegramBotToken = token;
        this.exchangeRatesApiUrl = apiUrl
    }


    public getTelegramBotToken(): string {
        return this.telegramBotToken;
    }

    public getExchangeRatesApiUrl(): string {
        return this.exchangeRatesApiUrl;
    }
}