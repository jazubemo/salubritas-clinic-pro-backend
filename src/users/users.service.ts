import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Status } from './status.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOne(filter: Record<string, any>): Promise<User | null> {
    try {
      const dbUser = await this.userModel.findOne(filter).exec();

      if (!dbUser) {
        throw new NotFoundException('User profile not found in database.');
      }

      if (dbUser.status === Status.ARCHIVED.toString()) {
        throw new UnauthorizedException('Your account has been suspended.');
      }

      return dbUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        'Failed to fetch this user from database',
        errorMessage,
      );

      throw new InternalServerErrorException(
        'An unexpected error occurred while retrieving this user.',
      );
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userModel.find().exec();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error('Failed to fetch users from database', errorMessage);

      throw new InternalServerErrorException(
        'Failed to retrieve users due to a database error.',
      );
    }
  }
}
