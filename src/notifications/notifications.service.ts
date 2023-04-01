import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

import { NAME } from './constants';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue(NAME) private notificationsQueue: Queue) {}
}
