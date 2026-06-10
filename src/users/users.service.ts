import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FlattenMaps, Model, ProjectionType } from 'mongoose';
import { User } from './schemas/user.schema';
import { UserStatus } from './enums/user-status.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOne(
    filter: Record<string, any>,
    projection?: ProjectionType<User>,
  ): Promise<FlattenMaps<User> | null> {
    try {
      const dbUser = await this.userModel
        .findOne(filter, projection)
        .lean()
        .exec();

      if (!dbUser) {
        throw new NotFoundException('User profile not found in database.');
      }

      const isArchivedEverywhere = dbUser.clinicMemberships.every(
        (membership) => membership.status === UserStatus.ARCHIVED,
      );

      if (isArchivedEverywhere) {
        throw new UnauthorizedException('Your account has been suspended.');
      }

      return dbUser as FlattenMaps<User>;
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
