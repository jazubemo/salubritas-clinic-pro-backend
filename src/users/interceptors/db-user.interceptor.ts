import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UsersService } from '../users.service';
import { REQUIRE_DB_USER_KEY } from '../decorators/require-db-user.decorator';
import { AuthenticatedRequest } from '../../firebase/interfaces/authenticated-request';
import { UserStatus } from '../enums/user-status.enum';
import { RedisService } from 'src/redis/redis.service';
import { getUserClinicRolesInObject } from 'src/common/helpers/get-user-clinic-roles-in-object';

@Injectable()
export class DbUserInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DbUserInterceptor.name);

  constructor(
    private reflector: Reflector,
    private userService: UsersService,
    private redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const requireDbUser = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_DB_USER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireDbUser) {
      return next.handle();
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext<{ req: AuthenticatedRequest }>();

    if (!req?.token) {
      throw new UnauthorizedException(
        'Authentication token required for this resource',
      );
    }

    try {
      const dbUser = await this.userService.findOne({ authId: req?.token.uid });

      if (!dbUser) {
        throw new UnauthorizedException('Access Denied: Unregistered account.');
      }

      const activeClinicMemberships = dbUser.clinicMemberships.filter(
        (clinic) => clinic.status === UserStatus.ACTIVE,
      );

      const dbClinicRoles = getUserClinicRolesInObject(activeClinicMemberships);

      // save in redis
      await this.redisService.setUserRoles(dbUser.authId, dbClinicRoles);

      req.user = {
        ...dbUser,
        clinicMemberships: activeClinicMemberships,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        '[DbUserInterceptor] Failed to fetch this user from database',
        errorMessage,
      );
    }

    return next.handle();
  }
}
