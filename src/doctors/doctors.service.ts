// import { Injectable, Logger } from '@nestjs/common';
// import { Types } from 'mongoose';
// import { User } from 'src/users/schemas/user.schema';
// import { UsersService } from 'src/users/users.service';

// @Injectable()
// export class DoctorsService {
//   private readonly logger = new Logger(DoctorsService.name);

//   constructor(private readonly usersService: UsersService) {}

//   async findDoctorsByClinicId(clinicId: string): Promise<Partial<User[]>> {
//     const clinicObjectId = new Types.ObjectId(clinicId);

//     return this.usersService.find(
//       {
//         clinicMemberships: {
//           $elemMatch: {
//             clinicId: clinicObjectId,
//             roles: 'DOCTOR',
//             status: 'ACTIVE',
//           },
//         },
//       },
//       {
//         firstName: 1,
//         lastName: 1,
//         email: 1,
//         id: 1,
//         clinicMemberships: {
//           $elemMatch: { clinicId: clinicObjectId },
//         },
//         doctorProfile: {
//           specialty: 1,
//         },
//       },
//     );
//   }
// }
