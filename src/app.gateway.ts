import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({ cors: true })
export class AppGateway {}
