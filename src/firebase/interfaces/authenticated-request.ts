import { Request } from 'express';
import * as admin from 'firebase-admin';
import { UserWithMemberships } from 'src/users/interfaces/user-with-memberships';

export interface AuthenticatedRequest extends Request {
  token?: admin.auth.DecodedIdToken;
  user?: UserWithMemberships;
}
