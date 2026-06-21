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
import { UserStatus } from 'src/users/enums/user-status.enum';
import { getUserClinicRolesInObject } from 'src/common/helpers/get-user-clinic-roles-in-object';

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

  checkClinicAccessFromCache(
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

  async getAndCacheUserClinicRoles(
    authId: string,
    activeClinicId: string,
  ): Promise<Role[]> {
    const dbUser = await this.userService.findOne(
      { authId },
      { clinicMemberships: 1, _id: 0 },
    );

    if (dbUser) {
      const activeClinicMemberships = dbUser.clinicMemberships.filter(
        (clinic) => clinic.status === UserStatus.ACTIVE,
      );

      const dbUserClinic = activeClinicMemberships.find(
        (membership) => membership.clinicId.toString() === activeClinicId,
      );

      if (!dbUserClinic) {
        throw new ForbiddenException(
          "You're not allowed to see this clinic resources",
        );
      }

      // Note: In Redis we save it as Map for optimization
      const dbClinicRoles = getUserClinicRolesInObject(activeClinicMemberships);

      await this.redisService.setUserRoles(authId, dbClinicRoles);

      return dbUserClinic.roles;
    } else {
      throw new BadRequestException('User does not exist on the database');
    }
  }

  async checkClinicRoles(
    requiredRoles: Role[],
    activeClinicId: string,
    authId: string,
  ): Promise<boolean> {
    let activeClinicRoles: Role[] = [];

    const cachedUserClinicMap = await this.redisService.getUserRoles(authId);

    if (cachedUserClinicMap) {
      this.checkClinicAccessFromCache(cachedUserClinicMap, activeClinicId);
      activeClinicRoles = cachedUserClinicMap[activeClinicId];
    } else {
      activeClinicRoles = await this.getAndCacheUserClinicRoles(
        authId,
        activeClinicId,
      );
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return activeClinicRoles.some((role) => requiredRoles.includes(role));
  }
}
