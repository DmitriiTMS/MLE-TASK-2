export interface ITelegramUpdate {
  update_id: number;
  message?: ITelegramMessage;
}

export interface ITelegramMessage {
  message_id: number;
  from: ITelegramUser;
  chat: ITelegramChat;
  text?: string;
  date: number;
}

export interface ITelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface ITelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface ITelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}
