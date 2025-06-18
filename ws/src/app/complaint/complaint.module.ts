import { Module } from '@nestjs/common'
import { ComplaintGateway } from './complaint.gateway'
import { ComplaintService } from './complaint.service'

@Module({
	providers: [ComplaintGateway, ComplaintService],
	exports: [ComplaintService, ComplaintGateway],
})
export class ComplaintModule {}
