import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { AppAdapter } from './app/app.adapter'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'

async function bootstrap() {
	const logger = new Logger('Bootstrap')
	const app = await NestFactory.create(AppModule)

	// Получаем конфигурацию из ConfigService
	const configService = app.get(ConfigService)

	// Получаем инстанс номер для шардирования с корректной проверкой
	const instanceIdStr = configService.get<string>('INSTANCE_ID', '0')
	const instanceId = parseInt(instanceIdStr) || 0 // Добавляем fallback к 0 в случае NaN

	const totalInstancesStr = configService.get<string>('TOTAL_INSTANCES', '1')
	const totalInstances = parseInt(totalInstancesStr) || 1 // Добавляем fallback к 1 в случае NaN

	// Настраиваем порт в зависимости от инстанса с проверкой на NaN
	const basePortStr = configService.get('PORT', '7000')
	const basePort = parseInt(basePortStr) || 7000 // Добавляем fallback к 7000
	const port = basePort + instanceId

	// Включаем TCP для микросервисной коммуникации
	const tcpHost = configService.get<string>('TCP_HOST', 'localhost')
	const tcpPortStr = configService.get<string>('TCP_PORT', '7755')
	const tcpPort = parseInt(tcpPortStr) || 7755 // Добавляем fallback к 7755

	logger.log(
		`Using TCP port: ${tcpPort}, Instance ID: ${instanceId}, Total Instances: ${totalInstances}`
	)
	logger.log(`WebSocket server will start on port: ${port}`)

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.TCP,
		options: {
			host: tcpHost,
			port: tcpPort,
		},
	})

	// Настраиваем WebSocket-адаптер с шардированием
	app.useWebSocketAdapter(
		new AppAdapter(app, {
			instanceId,
			totalInstances,

			// Функция для распределения пользователей по серверам
			userShardResolver: (userId: string) => {
				// Простая хеш-функция для распределения
				const hash = userId.split('').reduce((acc, char) => {
					return acc + char.charCodeAt(0)
				}, 0)

				return hash % totalInstances
			},
		})
	)

	// Запускаем микросервисы
	await app.startAllMicroservices()

	// Запускаем основной сервер
	await app.listen(port)

	logger.log(
		`WebSocket server instance ${instanceId}/${totalInstances} started on port ${port}`
	)
	logger.log(`TCP microservice running on ${tcpHost}:${tcpPort}`)
}

bootstrap().catch(err => {
	console.error('Failed to start WebSocket server:', err)
	process.exit(1)
})
