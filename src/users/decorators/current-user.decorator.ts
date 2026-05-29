import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../user.schema';
import { AuthenticatedRequest } from '../../firebase/interfaces/authenticated-request';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User | undefined => {
    const ctx = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>();
    return ctx.req.user;
  },
);
