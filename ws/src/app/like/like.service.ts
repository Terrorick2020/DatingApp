import { Injectable } from '@nestjs/common'
import { BaseWsService } from '@/abstract/abstract.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class LikeService extends BaseWsService {
	constructor(private readonly configService: ConfigService) {
		const host = configService.get<string>('API_HOST')
		const port = configService.get<number>('LIKE_PORT')

		super(host || 'localhost', port || 3003)

		// После вызова super() можно безопасно присваивать this
		this.configService = configService
	}
}
