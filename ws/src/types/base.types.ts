import { ConnectionDto } from '@/abstract/dto/connection.dto'
import { ResConnectionDto } from '~/src/abstract/dto/response.dto'

export enum ConnectionStatus {
	Error = 'error',
	Success = 'success',
}

export enum ServerMethods {
	JoinRoom = 'joinRoom',
	LeaveRoom = 'leaveRoom',
}

export enum ClientMethods {
	Connection = 'connection',
}

export interface ClientToServerEvents {
	[ServerMethods.JoinRoom]: (connection: ConnectionDto) => Promise<void>
	[ServerMethods.LeaveRoom]: (connection: ConnectionDto) => Promise<void>
}

export interface ServerToClientEvents {
	[ClientMethods.Connection]: (
		connection: ResConnectionDto
	) => Promise<void>
	[ClientMethods.Connection]: (
		connection: ResConnectionDto
	) => Promise<void>
}
