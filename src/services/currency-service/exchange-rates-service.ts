import { ICurrencyService } from './currency-service.interface';
import { IConfig } from '../../config/config.interface';
import { ILogger } from '../../utils/logger.interface';
import { IExchangeRateResponse } from '../../models/types';
import { IHttpClient } from '../../api/http-client.interface';

export class ExchangeRatesService implements ICurrencyService {
  private readonly exchangeRatesApiUrl: string;

  constructor(
    private readonly config: IConfig,
    private readonly logger: ILogger,
    private readonly httpClient: IHttpClient
  ) {
    this.exchangeRatesApiUrl = this.config.getExchangeRatesApiUrl();
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    const url = `${this.exchangeRatesApiUrl}/${from}`;

    this.logger.info(`Fetching exchange rates from API`, { url, from, to });

    try {
      const data = await this.httpClient.get<IExchangeRateResponse>(url);

      this.logger.info(`API response received successfully`, { 
        url,
        base: data.base,
        date: data.date
      });

      this.logger.info(`API response parsed successfully`, {
        base: data.base,
        availableRates: Object.keys(data.rates),
        date: data.date
      });

      if (!data.rates[to]) {
        const error = `Currency ${to} not found in rates`;
        this.logger.error(error, { availableRates: Object.keys(data.rates) });
        throw new Error(error);
      }

      const rate = data.rates[to];
      this.logger.info(`Exchange rate calculated`, { from, to, rate });

      return rate;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error in getExchangeRate`, {
          message: error.message,
          stack: error.stack,
          from,
          to
        });
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }
}