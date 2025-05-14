import { Module } from '@nestjs/common'
import { MonitoringService } from './monitoring.service'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
	imports: [ScheduleModule.forRoot()],
	providers: [MonitoringService],
	exports: [MonitoringService],
})
export class MonitoringModule {}
