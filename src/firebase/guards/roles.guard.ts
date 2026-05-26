import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedRequest } from '../interfaces/authenticated-interface';
import { ClinicArgs } from '../interfaces/clinic.args';
import { RedisService } from 'src/redis/redis.service';
import { Reflector } from '@nestjs/core';
import { isEmptyArray } from 'src/common/helpers/array.helper';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const request = ctx.getContext<{ req: AuthenticatedRequest }>().req;
    const authId = request.token?.uid;

    if (!authId) {
      throw new UnauthorizedException(
        'Authentication token required for this resource',
      );
    }

    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (isEmptyArray(requiredRoles)) {
      return true;
    }

    const args = ctx.getArgs<ClinicArgs>();
    const { activeClinicId } = args;

    if (!activeClinicId) {
      throw new BadRequestException(
        'The activeClinicId parameter is required to authorize this request.',
      );
    }

    const isAuthorized = await this.checkClinicRoles(
      requiredRoles,
      activeClinicId,
      authId,
    );

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You're not allowed to see this clinic resources",
      );
    }

    return true;
  }

  async checkClinicRoles(
    requiredRoles: string[],
    activeClinicId: string,
    authId: string,
  ): Promise<boolean> {
    const cachedClinicRoles = await this.redisService.getUserRoles(authId);

    if (cachedClinicRoles) {
      const activeClinicRoles = cachedClinicRoles[activeClinicId] || [];
      return activeClinicRoles.some((role) => requiredRoles.includes(role));
    }

    // TODO: get user roles from the database
    return false;
  }
}
