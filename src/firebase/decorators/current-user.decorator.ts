import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../users/user.schema';
import { AuthenticatedRequest } from '../interfaces/authenticated-interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User | undefined => {
    const ctx = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>();
    return ctx.req.user;
  },
);
