import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicMembership, UserStatus } from '@prisma-custom';
import { UserWithMemberships } from './interfaces/user-with-memberships';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  private handleError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.stack : String(error);
    this.logger.error('Failed to fetch this user from database', errorMessage);
    throw new InternalServerErrorException(
      'An unexpected error occurred while retrieving this user.',
    );
  }

  private validateUserStatus(dbUser: UserWithMemberships): void {
    const memberships = dbUser.clinicMemberships;
    const isArchivedEverywhere =
      memberships.length > 0 &&
      memberships.every(
        (membership: ClinicMembership) =>
          membership.status === UserStatus.ARCHIVED,
      );

    if (isArchivedEverywhere) {
      throw new UnauthorizedException(
        `User whose name is ${dbUser.firstName} ${dbUser.lastName} has been suspended.`,
      );
    }
  }

  async findOne(
    filter: Record<string, any>,
    select?: Record<string, any>,
  ): Promise<User> {
    try {
      const queryOptions: any = { where: filter };

      const relations = {
        clinicMemberships: {
          include: { clinic: true },
        },
        patient: true,
        doctor: true,
      };

      if (select) {
        queryOptions.select = {
          ...select,
          ...relations,
        };
      } else {
        queryOptions.include = relations;
      }

      const dbUser = await this.prisma.user.findFirst(queryOptions);

      if (!dbUser) {
        throw new NotFoundException('User profile not found in database.');
      }

      this.validateUserStatus(dbUser as unknown as UserWithMemberships);

      return dbUser as unknown as User;
    } catch (error) {
      return this.handleError(error);
    }
  }

  // async find(
  //   filters: Record<string, any>,
  //   projection?: ProjectionType<User>,
  //   session?: ClientSession,
  // ): Promise<User[]> {
  //   try {
  //     const query = this.userModel.find(filters, projection).lean();

  //     if (session) {
  //       query.session(session);
  //     }

  //     return await query.exec();
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.stack : String(error);
  //     this.logger.error(
  //       'Failed to fetch these users from database',
  //       errorMessage,
  //     );

  //     throw new InternalServerErrorException(
  //       'An unexpected error occurred while retrieving users.',
  //     );
  //   }
  // }

  // async fetchAuthorizedUser(
  //   userId: Types.ObjectId,
  //   requestingClinicId: Types.ObjectId,
  //   expectedRole: Role,
  //   session?: ClientSession,
  // ) {
  //   try {
  //     const user = await this.findOne(
  //       {
  //         _id: userId,
  //       },
  //       undefined,
  //       session,
  //     );

  //     if (!user) {
  //       throw new NotFoundException(`User with id (${userId}) not found`);
  //     }

  //     const clinicMembership = user.clinicMemberships.find(
  //       (clinic) =>
  //         clinic.clinicId.toString() === requestingClinicId.toString() &&
  //         clinic.status === UserStatus.ACTIVE,
  //     );

  //     if (!clinicMembership) {
  //       throw new ForbiddenException(
  //         `This user ${userId} is not an active member of the requested clinic.`,
  //       );
  //     }

  //     const hasRequiredRole = clinicMembership.roles.includes(expectedRole);

  //     if (!hasRequiredRole) {
  //       throw new ForbiddenException(
  //         `This user does not have the required role (${expectedRole.toLowerCase()}) assigned at this clinic.`,
  //       );
  //     }

  //     return user;
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }

  //     const errorMessage = error instanceof Error ? error.stack : String(error);
  //     this.logger.error(
  //       `Failed to fetch user ${userId} from database`,
  //       errorMessage,
  //     );

  //     throw new InternalServerErrorException(
  //       'Failed to retrieve this user due to a database error.',
  //     );
  //   }
  // }
}
