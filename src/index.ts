import { HttpClientAxios } from './api/http-client';
import { Config } from './config/config';
import { TelegramService } from './services/telegram/telegram-service';
import { ITelegramService } from './services/telegram/telegram.interface';
import { Logger } from './utils/logger';
import { ILogger } from './utils/logger.interface';

class Bot {

    private lastUpdateId: number = 0;

    constructor(
        private readonly logger: ILogger,
        private readonly telegramService: ITelegramService
    ) { }

    async start(): Promise<void> {
        this.logger.info('Starting Currency Bot...');
        try {
            await this.pollUpdates();
        } catch (error) {
            this.logger.error('Fatal error in bot', error);
            process.exit(1);
        }
    }

    private async pollUpdates(): Promise<void> {
        while (true) {
            try {
                const updates = await this.telegramService.getUpdates(this.lastUpdateId + 1);

                for (const update of updates) {
                    if (update.message) {
                        console.log(update.message);
                        this.lastUpdateId = update.update_id;
                    }
                }

                await this.sleep(1000);
            } catch (error) {
                this.logger.error('Error in pollUpdates', error);
                await this.sleep(5000);
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

const logger = new Logger();
const config = new Config();
const httpClient = new HttpClientAxios(logger);
const telegramService = new TelegramService(config, logger, httpClient);

const bot = new Bot(logger, telegramService);
bot.start().catch(error => {
    logger.error('Failed to start bot', error);
    process.exit(1);
});