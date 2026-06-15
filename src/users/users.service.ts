import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  FlattenMaps,
  Model,
  ProjectionType,
  Types,
} from 'mongoose';
import { User } from './schemas/user.schema';
import { UserStatus } from './enums/user-status.enum';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOne(
    filter: Record<string, any>,
    projection?: ProjectionType<User>,
    session?: ClientSession,
  ): Promise<FlattenMaps<User> | null> {
    try {
      const query = this.userModel.findOne(filter, projection).lean();

      if (session) {
        query.session(session);
      }

      const dbUser = await query.exec();

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
      if (error instanceof HttpException) {
        throw error;
      }

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

  async findActiveClinicMember(
    userId: Types.ObjectId,
    requestingClinicId: string,
    expectedRole: Role,
    session?: ClientSession,
  ) {
    try {
      const user = await this.findOne(
        {
          _id: userId,
        },
        undefined,
        session,
      );

      if (!user) {
        throw new NotFoundException(
          `User whose role is (${expectedRole}) not found`,
        );
      }

      const clinicMembership = user.clinicMemberships.find(
        (clinic) =>
          clinic.clinicId.toString() === requestingClinicId &&
          clinic.status === UserStatus.ACTIVE,
      );

      if (!clinicMembership) {
        throw new ForbiddenException(
          `This user is not a member of the requested clinic.`,
        );
      }

      const hasRequiredRole = clinicMembership.roles.includes(expectedRole);

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `This user does not have the required role (${expectedRole.toLowerCase()}) assigned at this clinic.`,
        );
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `Failed to fetch user ${userId} from database`,
        errorMessage,
      );

      throw new InternalServerErrorException(
        'Failed to retrieve this user due to a database error.',
      );
    }
  }
}
