export interface ICurrencyService {
  getExchangeRate(from: string, to: string): Promise<number>;
}