import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppAdapter } from './app/app.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new AppAdapter(app));
  await app.listen(process.env.PORT ?? 7000);
}
bootstrap();
