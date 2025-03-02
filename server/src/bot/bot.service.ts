import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Context } from 'telegraf/typings/context';

@Injectable()
export class BotService {
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async start(ctx: Context) {

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'К знакомствам',
              web_app: {
                url: 'https://192.168.56.1:5173/',
              },
            },
          ],
        ],
      },
    };

    await ctx.reply('Добро пожаловать! Здесь можно протестировать выполнение техниеского задания!', inlineKeyboard)

  }
}