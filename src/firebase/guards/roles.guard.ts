import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedRequest } from '../interfaces/authenticated-request';
import { SecurityClinicArgs } from '../interfaces/clinic.args';
import { RedisService } from 'src/redis/redis.service';
import { Reflector } from '@nestjs/core';
import { UsersService } from 'src/users/users.service';
import { Role } from 'src/users/enums/role.enum';
import { Status } from 'src/users/enums/status.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
    private userService: UsersService,
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

    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    const args = ctx.getArgs<SecurityClinicArgs>();
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

  checkClinicAccess(
    clinicRoles: Record<string, Role[]>,
    activeClinicId: string,
  ) {
    const hasClinicAccess = Object.hasOwn(clinicRoles, activeClinicId);
    if (!hasClinicAccess) {
      throw new ForbiddenException(
        "You're not allowed to see this clinic resources",
      );
    }
  }

  async checkClinicRoles(
    requiredRoles: Role[],
    activeClinicId: string,
    authId: string,
  ): Promise<boolean> {
    let activeClinicRoles: Role[] = [];

    const cachedClinicRoles = await this.redisService.getUserRoles(authId);

    if (cachedClinicRoles) {
      this.checkClinicAccess(cachedClinicRoles, activeClinicId);
      activeClinicRoles = cachedClinicRoles[activeClinicId];
    } else {
      const dbUser = await this.userService.findOne(
        { authId },
        { clinicMemberships: 1, _id: 0 },
      );

      if (dbUser) {
        const dbUserClinic = dbUser.clinicMemberships.find(
          (membership) =>
            membership.clinicId.toString() === activeClinicId &&
            membership.status === Status.ACTIVE,
        );

        if (!dbUserClinic) {
          throw new ForbiddenException(
            "You're not allowed to see this clinic resources",
          );
        }

        activeClinicRoles = dbUserClinic.roles;

        // Note: In Redis we save it as Map for optimization
        const dbClinicRoles = dbUser.clinicMemberships.reduce(
          (accumulatorClinicRoles, currentMembership) => {
            accumulatorClinicRoles[currentMembership.clinicId.toString()] =
              currentMembership.roles;
            return accumulatorClinicRoles;
          },
          {},
        );

        await this.redisService.setUserRoles(authId, dbClinicRoles);
      } else {
        throw new BadRequestException('User does not exist on the database');
      }
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return activeClinicRoles.some((role) => requiredRoles.includes(role));
  }
}
