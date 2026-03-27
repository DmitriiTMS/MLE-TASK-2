import { ICurrencyService } from './currency-service.interface';


export class ExchangeRatesService implements ICurrencyService {

    constructor(){}
    getExchangeRate(from: string, to: string): Promise<number> {
        throw new Error('Method not implemented.');
    }

  
}