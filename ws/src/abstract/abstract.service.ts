import {
	ClientProxy,
	ClientProxyFactory,
	Transport,
} from '@nestjs/microservices'

import { ServerMethods } from '@/types/base.types'
import { ConnectionStatus } from '@/types/base.types'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import { ConnectionDto } from './dto/connection.dto'
import { ResConnectionDto } from './dto/response.dto'

export abstract class BaseWsService {
	protected readonly clientProxy: ClientProxy
	protected readonly errRes: ResConnectionDto
	protected readonly configService: ConfigService

	constructor( configService: ConfigService) {
		const host = configService.get<string>('API_TCP_HOST', 'localhost')
		const port: number = Number(
			configService.get<string>('API_TCP_PORT', '7755')
		)

		this.clientProxy = ClientProxyFactory.create({
			transport: Transport.TCP,
			options: { host, port },
		})

		this.configService = configService

		this.errRes = {
			telegramId: '',
			roomName: '',
			message: 'При выполнении возникла ошибка!',
			status: ConnectionStatus.Error,
		}
	}

	protected async sendRequest<TPattern, TRequest, TResponse>(
		pattern: TPattern,
		data: TRequest
	): Promise<TResponse | ResConnectionDto> {
		try {
			const response = await firstValueFrom(
				this.clientProxy.send<TResponse, TRequest>(pattern, data),
				{ defaultValue: { ...this.errRes } }
			)

			return response
		} catch {
			return this.errRes
		}
	}

	async joinRoom(
		connectionDto: ConnectionDto
	): Promise<ResConnectionDto> {
		return await this.sendRequest<
			ServerMethods,
			ConnectionDto,
			ResConnectionDto
		>(ServerMethods.JoinRoom, connectionDto)
	}

	async leaveRoom(
		connectionDto: ConnectionDto
	): Promise<ResConnectionDto> {
		return await this.sendRequest<
			ServerMethods,
			ConnectionDto,
			ResConnectionDto
		>(ServerMethods.LeaveRoom, connectionDto)
	}
}
