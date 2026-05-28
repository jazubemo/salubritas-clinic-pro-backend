import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';
import { AuthenticatedRequest } from '../interfaces/authenticated-request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const graphqlContext = ctx.getContext<{ req: AuthenticatedRequest }>();
    const req = graphqlContext.req;

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const firebaseToken = authHeader.split(' ')[1];
    if (!firebaseToken) {
      throw new UnauthorizedException('Malformed Authorization header');
    }

    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await this.firebaseService.verifyToken(firebaseToken);
    } catch {
      throw new UnauthorizedException('Invalid Firebase Token');
    }

    req.token = decodedToken;

    return true;
  }
}
