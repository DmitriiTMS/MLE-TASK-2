import { Logger } from './utils/logger';
import { ILogger } from './utils/logger.interface';

class Bot {

    constructor(private readonly logger: ILogger) { }

    async start(): Promise<void> {
        this.logger.info('Starting Currency Bot...');
        try {
            console.log('start');
        } catch (error) {
            this.logger.error('Fatal error in bot', error);
            process.exit(1);
        }
    }
    
}

const logger = new Logger();
const bot = new Bot(logger);
bot.start().catch(error => {
    logger.error('Failed to start bot', error);
    process.exit(1);
});