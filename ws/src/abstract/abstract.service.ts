import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { BaseWsConnectionDto } from './dto/connection.dto';
import { WsConnectionStatus } from '@/types/base.types';
import { firstValueFrom } from 'rxjs';
import { type ResServerConnection, WsServerMethothod } from '@/types/base.types';


export abstract class BaseWsService {
    protected clientProxy: ClientProxy;

    constructor(protected readonly host: string, protected readonly port: number) {
        this.clientProxy = ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: this.host,
            port: this.port,
          },
        });
    }
    
    protected async sendRequest(
        pattern: WsServerMethothod,
        data: BaseWsConnectionDto
    ): Promise<ResServerConnection> {
        const errData: ResServerConnection = {
            roomName: data.roomName,
            telegramId: data.telegramId,
            status: WsConnectionStatus.Success,
        };

        try {
            const response = await firstValueFrom(
                this.clientProxy.send<ResServerConnection, BaseWsConnectionDto>(pattern, data),
                { defaultValue: {...errData} }
            );

            return response;
        } catch {
            return errData;
        }
    }

    async joinRoom(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection> {
        return this.sendRequest(WsServerMethothod.JoinRoom, connectionDto);
    }

    async leaveRoom(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection> {
        return this.sendRequest(WsServerMethothod.LeaveRoom, connectionDto);
    }
}
