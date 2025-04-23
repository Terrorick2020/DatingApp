import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chats/chat.module';
import { MessagesModule } from './messages/messages.module';

import serverConfig from '@/config/server.config';
import connectionConfig from '@/config/connection.config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [serverConfig, connectionConfig]
    }),
    ChatModule,
    MessagesModule,
  ],
})
export class AppModule {};
