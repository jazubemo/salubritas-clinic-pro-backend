import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private readonly usersService: UsersService) {}

  async findPatientsByClinicId(clinicId: string): Promise<Partial<User[]>> {
    const clinicObjectId = new Types.ObjectId(clinicId);

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
  }
}
