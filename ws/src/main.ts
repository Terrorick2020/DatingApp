import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppAdapter } from './app/app.adapter';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Получаем конфигурацию из ConfigService
  const configService = app.get(ConfigService);
  
  // Получаем инстанс номер для шардирования
  const instanceId = configService.get<string>('INSTANCE_ID', '0');
  const totalInstances = parseInt(configService.get<string>('TOTAL_INSTANCES', '1'));
  
  // Настраиваем порт в зависимости от инстанса
  const basePort = parseInt(configService.get('PORT', '7000'));
  const port = basePort + parseInt(instanceId);
  
  // Включаем TCP для микросервисной коммуникации
  const tcpHost = configService.get('TCP_HOST', 'localhost');
  const tcpPort = parseInt(configService.get('TCP_PORT', '7756'));
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: tcpHost,
      port: tcpPort + parseInt(instanceId), // Шардирование TCP портов
    },
  });
  
  // Настраиваем WebSocket-адаптер с шардированием
  app.useWebSocketAdapter(new AppAdapter(app, {
    instanceId: parseInt(instanceId),
    totalInstances,
    
    // Функция для распределения пользователей по серверам
    userShardResolver: (userId: string) => {
      // Простая хеш-функция для распределения
      const hash = userId.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      
      return hash % totalInstances;
    }
  }));
  
  // Запускаем микросервисы
  await app.startAllMicroservices();
  
  // Запускаем основной сервер
  await app.listen(port);
  
  logger.log(`WebSocket server instance ${instanceId}/${totalInstances} started on port ${port}`);
  logger.log(`TCP microservice running on ${tcpHost}:${tcpPort + parseInt(instanceId)}`);
}

bootstrap().catch(err => {
  console.error('Failed to start WebSocket server:', err);
  process.exit(1);
});