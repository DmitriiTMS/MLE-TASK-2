import { ILogger } from "./logger.interface";
import { LogLevel } from "./types";

export class Logger implements ILogger {

    formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
        return `[${timestamp}] [${level}] ${message}${dataStr}`;
    }
    
    info(message: string, data?: any): void {
        console.log(this.formatMessage(LogLevel.INFO, message, data));
    }

    error(message: string, data?: any): void {
        console.error(this.formatMessage(LogLevel.ERROR, message, data));
    }

}