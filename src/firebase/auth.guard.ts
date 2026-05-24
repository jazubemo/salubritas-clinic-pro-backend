import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';

import { User } from '../users/user.schema';
import { Status } from 'src/users/status.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const graphqlContext = ctx.getContext<{ req: Request }>();
    const req = graphqlContext.req;

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Malformed Authorization header');
    }

    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await this.firebaseService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid Firebase Token');
    }

    const dbUser = await this.userModel
      .findOne({ authId: decodedToken.uid })
      .exec();
    if (!dbUser) {
      throw new UnauthorizedException('User profile not found in database.');
    }

    if (dbUser.status === Status.ARCHIVED) {
      throw new UnauthorizedException('Your account has been suspended');
    }

    req.user = dbUser;

    return true;
  }
}
