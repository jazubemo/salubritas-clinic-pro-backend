// import { Resolver, Query, Args } from '@nestjs/graphql';
// import { DoctorsService } from './doctors.service';
// import { SecurityClinicArgs } from 'src/common/security/clinic-security.args';
// import { RolesGuard } from 'src/firebase/guards/roles.guard';
// import { Roles } from 'src/firebase/decorators/roles.decorator';
// import { UseGuards } from '@nestjs/common';
// import { Role } from 'src/users/enums/role.enum';
// import { User } from 'src/users/schemas/user.schema';
// import { AuthGuard } from 'src/firebase/auth.guard';

// @Resolver(() => User)
// @UseGuards(AuthGuard)
// export class DoctorsResolver {
//   constructor(private readonly doctorsService: DoctorsService) {}

//   @Roles(Role.ADMIN)
//   @UseGuards(RolesGuard)
//   @Query(() => [User], { name: 'doctors' })
//   findDoctorsByClinicId(@Args() securityArgs: SecurityClinicArgs) {
//     return this.doctorsService.findDoctorsByClinicId(
//       securityArgs.activeClinicId,
//     );
//   }
// }
