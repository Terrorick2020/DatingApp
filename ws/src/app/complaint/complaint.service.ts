import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'
import { ComplaintCreateDto } from './dto/complaint-create.dto'
import { ComplaintUpdateDto } from './dto/complaint-update.dto'
import {
	ComplaintServerMethods,
	ComplaintCreateResponse,
	ComplaintUpdateResponse,
} from '@/types/complaint.types'
import { ResErrData } from '@/types/base.types'

@Injectable()
export class ComplaintService extends BaseWsService {
	constructor(private readonly configService: ConfigService) {
		const host = configService.get<string>('API_HOST')
		const port = configService.get<number>('COMPLAINT_PORT')

		super(host || 'localhost', port || 3005)

		// После вызова super() можно безопасно присваивать this
		this.configService = configService
	}

	async createComplaint(
		complaintData: ComplaintCreateDto
	): Promise<ComplaintCreateResponse | ResErrData> {
		return await this.sendRequest<
			ComplaintServerMethods,
			ComplaintCreateDto,
			ComplaintCreateResponse
		>(ComplaintServerMethods.CreateComplaint, complaintData)
	}

	async updateComplaint(
		complaintData: ComplaintUpdateDto
	): Promise<ComplaintUpdateResponse | ResErrData> {
		return await this.sendRequest<
			ComplaintServerMethods,
			ComplaintUpdateDto,
			ComplaintUpdateResponse
		>(ComplaintServerMethods.UpdateComplaint, complaintData)
	}
}
