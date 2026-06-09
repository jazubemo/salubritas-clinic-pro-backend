import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../schemas/user.schema';
import { AuthenticatedRequest } from '../../firebase/interfaces/authenticated-request';
import { FlattenMaps } from 'mongoose';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): FlattenMaps<User> | undefined => {
    const ctx = GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>();
    return ctx.req.user;
  },
);
