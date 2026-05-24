import { User } from '../users/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Teaches TypeScript that req.user exists and holds a User document
    }
  }
}
