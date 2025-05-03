import {
	ComplaintClientMethods,
	ComplaintClientToServerEvents,
	SendComplaintTcpPatterns,
	ComplaintServerToClientEvents,
	ComplaintUpdateResponse,
} from '@/types/complaint.types'
import { EventPattern, Payload } from '@nestjs/microservices'
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { BaseWsGateway } from '~/src/abstract/abstract.gateway'
import { ComplaintService } from './complaint.service'
import { ComplaintCreateDto } from './dto/complaint-create.dto'
import { ComplaintUpdateDto } from './dto/complaint-update.dto'

@WebSocketGateway(7000, {
	namespace: 'complaint',
	cors: {
		origin: '*',
	},
})
export class ComplaintGateway extends BaseWsGateway<
	ComplaintService,
	ComplaintClientToServerEvents,
	ComplaintServerToClientEvents
> {
	constructor(private readonly complaintService: ComplaintService) {
		super(complaintService)
	}

	@SubscribeMessage(SendComplaintTcpPatterns.CreateComplaint)
	async handleCreateComplaint(
		@Payload() complaintData: ComplaintCreateDto
	): Promise<void> {
		const response = await this.complaintService.createComplaint(complaintData)
		this.server
			.to(complaintData.roomName)
			.emit(ComplaintClientMethods.ComplaintCreated, response)
	}

	@SubscribeMessage(SendComplaintTcpPatterns.UpdateComplaint)
	async handleUpdateComplaint(
		@Payload() complaintData: ComplaintUpdateDto
	): Promise<void> {
		const response = await this.complaintService.updateComplaint(complaintData)
		this.server
			.to(complaintData.roomName)
			.emit(ComplaintClientMethods.ComplaintUpdated, response)
	}

	@EventPattern(SendComplaintTcpPatterns.ComplaintStatusChanged)
	async handleComplaintStatusChanged(
		@Payload() statusUpdate: ComplaintUpdateResponse
	): Promise<void> {
		// Уведомляем обе стороны (жалобщика и ответчика) об изменении статуса
		this.server.emit(
			ComplaintClientMethods.ComplaintStatusUpdated,
			statusUpdate
		)
	}
}
