import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({
  cors: true,
  maxHttpBufferSize: 825000000, // 25 MB * (2^5 + 1)
  pingTimeout: 128000, // 128 seconds
  pingInterval: 16000, // 16 seconds
})
export class AppGateway {}
