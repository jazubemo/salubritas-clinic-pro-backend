import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly usersService: UsersService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findPatientsByClinicId(clinicId: string): Promise<Partial<User[]>> {
    const clinicObjectId = new Types.ObjectId(clinicId);

    try {
      return this.usersService.find(
        {
          clinicMemberships: {
            $elemMatch: {
              clinicId: clinicObjectId,
              roles: 'PATIENT',
              status: 'ACTIVE',
            },
          },
        },
        { clinicMemberships: 0 },
      );
    } catch (error) {
      this.logger.error('Error:', error);
      throw new Error('Failed to find users.');
    }
  }

  async searchPatients(
    clinicId: string,
    query: string,
  ): Promise<Partial<User[]>> {
    const clinicObjectId = new Types.ObjectId(clinicId);

    if (!query || query.trim() === '') {
      return await this.findPatientsByClinicId(clinicId);
    }

    try {
      const results: User[] = await this.userModel.aggregate([
        {
          $search: {
            index: 'default',
            compound: {
              filter: [
                {
                  embeddedDocument: {
                    path: 'clinicMemberships',
                    operator: {
                      compound: {
                        must: [
                          {
                            equals: {
                              path: 'clinicMemberships.clinicId',
                              value: clinicObjectId,
                            },
                          },
                          {
                            text: {
                              path: 'clinicMemberships.roles',
                              query: 'PATIENT',
                            },
                          },
                          {
                            text: {
                              path: 'clinicMemberships.status',
                              query: 'ACTIVE',
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
              should: [
                { autocomplete: { query: query, path: 'lastName' } },
                { autocomplete: { query: query, path: 'firstName' } },
                { autocomplete: { query: query, path: 'dni' } },
              ],
              minimumShouldMatch: 1,
            },
          },
        },
        {
          $project: {
            id: '$_id',
            firstName: 1,
            lastName: 1,
          },
        },
      ]);

      return results;
    } catch (error) {
      this.logger.error('GraphQL Atlas Search Error:', error);
      throw new Error('Failed to search users.');
    }
  }
}
