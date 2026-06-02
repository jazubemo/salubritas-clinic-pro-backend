import { Request } from 'express';
import * as admin from 'firebase-admin';
import { User } from '../../users/schemas/user.schema'; // Update to your schema path

export interface AuthenticatedRequest extends Request {
  token?: admin.auth.DecodedIdToken;
  user?: User;
}
