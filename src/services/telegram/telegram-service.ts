import { IHttpClient } from '../../api/http-client.interface';
import { Config } from '../../config/config';
import { ITelegramResponse, ITelegramUpdate } from '../../models/types';
import { ILogger } from '../../utils/logger.interface';
import { ITelegramService } from './telegram.interface';

export class TelegramService implements ITelegramService {

  private readonly telegramApiUrl: string;
  private readonly telegramBotToken: string;

  constructor(
    private readonly config: Config,
    private readonly logger: ILogger,
    private readonly httpClientAxios: IHttpClient
  ) {
    this.telegramApiUrl = this.config.getTelegramApiUrl();
    this.telegramBotToken = this.config.getTelegramBotToken();
  }

 
  async getUpdates(offset?: number): Promise<ITelegramUpdate[]> {

    const url = `${this.telegramApiUrl}${this.telegramBotToken}/getUpdates`;
    const params = offset ? { offset } : undefined;

    try {
      const response = await this.httpClientAxios.get<ITelegramResponse>(url, { params });

      if (!response.ok) {
        throw new Error(response.description || 'Failed to get updates');
      }

      return response.result;
    } catch (error) {
      this.logger.error('Error getting updates', error);
      throw error;
    }
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    const url = `${this.telegramApiUrl}${this.telegramBotToken}/sendMessage`;

    try {
      this.logger.info(`Sending message to chat ${chatId}`, { text });

      const response = await this.httpClientAxios.post<ITelegramResponse>(url, {
        chat_id: chatId,
        text: text,
      });

      if (!response.ok) {
        throw new Error(response.description || 'Failed to send message');
      }

      this.logger.info(`Message sent successfully to chat ${chatId}`);
    } catch (error) {
      this.logger.error(`Error sending message to chat ${chatId}`, error);
      throw error;
    }
  }
}