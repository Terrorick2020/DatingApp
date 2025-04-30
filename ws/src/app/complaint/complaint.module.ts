import { Module } from '@nestjs/common'
import { ComplaintGateway } from './complaint.gateway'
import { ComplaintService } from './complaint.service'

@Module({
	providers: [ComplaintGateway, ComplaintService],
})
export class ComplaintModule {}
