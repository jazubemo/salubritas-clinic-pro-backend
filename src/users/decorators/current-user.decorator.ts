import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedRequest } from '../../firebase/interfaces/authenticated-request';
import { UserWithMemberships } from '../interfaces/user-with-memberships';

export const CurrentUser = createParamDecorator(
  (
    data: unknown,
    context: ExecutionContext,
  ): UserWithMemberships | undefined => {
    const ctx = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>();
    return ctx.req.user;
  },
);
