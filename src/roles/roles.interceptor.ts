import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SOCKET_DASHBOARD_EVENTS } from 'src/dashboard/constants';
import { DashboardGateway } from 'src/dashboard/dashboard.gateway';
import { EVENTS } from 'src/ws-auth/constants';

import { RolesService } from './roles.service';

@Injectable()
export class RolesInterceptor implements NestInterceptor {
  constructor(
    private rolesService: RolesService,
    private dashboardGateway: DashboardGateway,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (data) => {
        const roles = Array.isArray(data)
          ? data
          : await this.rolesService.findAll();

        this.dashboardGateway.namespace.emit(
          `${EVENTS.LISTENER}:${SOCKET_DASHBOARD_EVENTS.LIST_ROLE}`,
          {
            roles,
          },
        );

        return data;
      }),
    );
  }
}
