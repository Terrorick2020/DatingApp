import { Module, Global } from '@nestjs/common'
import Redis from 'ioredis'
import { ConfigService, ConfigModule } from '@nestjs/config'
import { RedisService } from './redis.service'

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: 'REDIS_CLIENT',
			useFactory: (configService: ConfigService) => {
				const host = configService.get('REDIS_HOST', 'localhost')
				const port = parseInt(configService.get('REDIS_PORT', '6379'))
				const password = configService.get('REDIS_PASSWORD', '')
				const db = parseInt(configService.get('REDIS_DB', '0'))

				const options = {
					host,
					port,
					password,
					db,
					retryStrategy(times: number) {
						const delay = Math.min(times * 100, 2000)
						return delay
					},
					enableReadyCheck: true,
					maxRetriesPerRequest: 3,
				}

				return new Redis(options)
			},
			inject: [ConfigService],
		},
		RedisService,
	],
	exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
