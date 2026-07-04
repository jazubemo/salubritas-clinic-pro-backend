import { Resolver, Query, Args } from '@nestjs/graphql';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { Roles } from 'src/firebase/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { Role } from 'src/users/enums/role.enum';
import { RolesGuard } from 'src/firebase/guards/roles.guard';
import { User } from 'src/users/schemas/user.schema';
import { SecurityClinicArgs } from 'src/common/security/clinic-security.args';
import { AuthGuard } from 'src/firebase/auth.guard';

@Resolver(() => Patient)
@UseGuards(AuthGuard)
export class PatientsResolver {
  constructor(private readonly patientsService: PatientsService) {}

  @Roles(Role.ADMIN, Role.DOCTOR)
  @UseGuards(RolesGuard)
  @Query(() => [User], { name: 'patients' })
  findPatientsByClinicId(@Args() securityArgs: SecurityClinicArgs) {
    return this.patientsService.findPatientsByClinicId(
      securityArgs.activeClinicId,
    );
  }
}
