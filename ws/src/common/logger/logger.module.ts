import { Module, Global } from '@nestjs/common'
import { AppLogger } from './logger.service'
import { ConfigModule } from '@nestjs/config'

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: AppLogger,
			useFactory: () => {
				return new AppLogger()
			},
		},
	],
	exports: [AppLogger],
})
export class LoggerModule {}
