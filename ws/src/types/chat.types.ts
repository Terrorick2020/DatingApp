export interface Message {
    id: number,
    socketId: string,
    isFrom: boolean
}

export interface ClientToServerListen {
    message: (message: Message) => void
}

export interface ServerToClientListen {
    message: (message: Message) => void
}
