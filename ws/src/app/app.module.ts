import { Module } from '@nestjs/common';
import { ChatModule } from './chats/chat.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [ChatModule, MessagesModule],
})
export class AppModule {};
