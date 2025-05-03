import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'
import { AppAdapter } from './app/app.adapter'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.TCP,
		options: {
		  host: process.env.TCP_HOST || 'localhost',
		  port: parseInt(process.env.TCP_PORT || '7756'),
		},
	})

	app.useWebSocketAdapter(new AppAdapter(app))
	await app.listen(process.env.PORT ?? 7000)
}
bootstrap()
