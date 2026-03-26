import { LogLevel } from "./types";

export interface ILogger {
    formatMessage(level: LogLevel, message: string, data?: any): string,
    info(message: string, data?: any): void,
    error(message: string, data?: any): void,
}