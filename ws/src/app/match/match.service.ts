import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class MatchService extends BaseWsService {
	constructor(protected readonly configService: ConfigService) {
		super(configService)
	}
}
