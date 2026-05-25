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

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const graphqlContext = ctx.getContext<{ req: AuthenticatedRequest }>();
    const req = graphqlContext.req;

    if (!req?.token) {
      throw new UnauthorizedException(
        'Authentication token required for this resource',
      );
    }

    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(), // Points to the specific resolver function being called
    );

    if (requiredRoles.length === 0) {
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
      req?.token.uid,
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
  ) {
    const userClinicRoles = await this.redisService.getUserRoles(authId);

    if (userClinicRoles) {
      return userClinicRoles[activeClinicId].some((role) =>
        requiredRoles.includes(role),
      );
    }

    // TODO: get user roles from the database
    return false;
  }
}
