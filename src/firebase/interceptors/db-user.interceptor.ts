import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UsersService } from '../../users/users.service';
import { REQUIRE_DB_USER_KEY } from '../decorators/require-db-user.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-interface';

@Injectable()
export class DbUserInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private userService: UsersService,
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

    const dbUser = await this.userService.findOne({ authId: req?.token.uid });
    if (!dbUser) {
      throw new UnauthorizedException('User profile not found');
    }

    req.user = dbUser;

    return next.handle();
  }
}
