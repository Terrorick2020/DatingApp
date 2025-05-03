import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'
import { ComplaintCreateDto } from './dto/complaint-create.dto'
import { ComplaintUpdateDto } from './dto/complaint-update.dto'
import {
	SendComplaintTcpPatterns,
	ComplaintCreateResponse,
	ComplaintUpdateResponse,
} from '@/types/complaint.types'
import { ResConnectionDto } from '~/src/abstract/dto/response.dto'

@Injectable()
export class ComplaintService extends BaseWsService {
	constructor(protected readonly configService: ConfigService) {
		super(configService)
	}

	async createComplaint(
		complaintData: ComplaintCreateDto
	): Promise<ComplaintCreateResponse | ResConnectionDto> {
		return await this.sendRequest<
			SendComplaintTcpPatterns,
			ComplaintCreateDto,
			ComplaintCreateResponse
		>(SendComplaintTcpPatterns.CreateComplaint, complaintData)
	}

	async updateComplaint(
		complaintData: ComplaintUpdateDto
	): Promise<ComplaintUpdateResponse | ResConnectionDto> {
		return await this.sendRequest<
			SendComplaintTcpPatterns,
			ComplaintUpdateDto,
			ComplaintUpdateResponse
		>(SendComplaintTcpPatterns.UpdateComplaint, complaintData)
	}
}
