import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { BaseWsConnectionDto } from './dto/connection.dto';
import { WsConnectionStatus } from '@/types/base.types';
import { firstValueFrom } from 'rxjs';
import { type ResServerConnection, WsServerMethothod, ResErrData } from '@/types/base.types';


export abstract class BaseWsService {
    protected clientProxy: ClientProxy;
    protected readonly errRes: ResErrData;

    constructor(protected readonly host: string, protected readonly port: number) {
        this.clientProxy = ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: this.host,
            port: this.port,
          },
        });

        this.errRes = {
            message: 'При выполнении действия возникла ошибка!',
            status: WsConnectionStatus.Error,
        }
    }

    protected async sendRequest<TPattern, TRequest, TResponce>(
        pattern: TPattern,
        data: TRequest,
    ): Promise<TResponce | ResErrData> {
        try {
            const response = await firstValueFrom(
                this.clientProxy.send<TResponce, TRequest>(pattern, data),
                { defaultValue: {...this.errRes} }
            );

            return response;
        } catch {
            return this.errRes;
        }
    }

    async joinRoom(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
        return await this.sendRequest<
            WsServerMethothod,
            BaseWsConnectionDto,
            ResServerConnection
        > (WsServerMethothod.JoinRoom, connectionDto)
    }

    async leaveRoom(connectionDto: BaseWsConnectionDto): Promise<ResServerConnection | ResErrData> {
        return await this.sendRequest<
            WsServerMethothod,
            BaseWsConnectionDto,
            ResServerConnection
        > (WsServerMethothod.LeaveRoom, connectionDto)
    }
}
