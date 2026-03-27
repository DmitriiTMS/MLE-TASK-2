import { ICommand } from './command.interface';
import { StartCommand } from './start-command';
import { CurrencyCommand } from './currency-command';
import { ILogger } from '../utils/logger.interface';
import { ICurrencyService } from '../services/currency-service/currency-service.interface';
import { StopCommand } from './stop-command';

export class CommandFactory {
  private commands: ICommand[];
  private currencyCommand: CurrencyCommand;

  constructor(
    private readonly currencyService: ICurrencyService,
    private readonly logger: ILogger
  ) {
    this.currencyCommand = new CurrencyCommand(this.logger, this.currencyService);
    this.commands = [
      new StartCommand(this.logger),
      this.currencyCommand,
      new StopCommand(this.logger, this.currencyCommand),
    ];
  }

  getCommands(): ICommand[] {
    return this.commands;
  }

  getCurrencyCommand(): CurrencyCommand {
    return this.currencyCommand;
  }

  findCommand(commandText: string): ICommand | undefined {
    return this.commands.find(cmd => cmd.shouldExecute(commandText));
  }
}