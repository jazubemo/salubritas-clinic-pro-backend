import { Resolver, Query, Args } from '@nestjs/graphql';
import { AppointmentsService } from './appointments.service';

import { AppointmentFiltersArgs } from './args/get-appointments-filter.args';

import { Roles } from 'src/firebase/decorators/roles.decorator';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/firebase/guards/roles.guard';
import { Role } from 'src/users/enums/role.enum';
import { AuthGuard } from 'src/firebase/auth.guard';
import { SecurityClinicArgs } from 'src/common/security/clinic-security.args';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { RequireDbUser } from 'src/users/decorators/require-db-user.decorator';
import { UserStatus } from 'src/users/enums/user-status.enum';
import { User } from 'src/users/entities/user.entity';
import { Appointment } from './entities/appointment.entity';

@Resolver(() => Appointment)
@UseGuards(AuthGuard)
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @UseGuards(RolesGuard)
  @Query(() => [Appointment], { name: 'appointments' })
  @RequireDbUser()
  findAppointments(
    @Args() securityArgs: SecurityClinicArgs,
    @Args() filters: AppointmentFiltersArgs,
    @CurrentUser() user: User,
  ) {
    const { activeClinicId } = securityArgs;

    // double-checking security
    const clinicMembership = user.clinicMemberships?.find(
      (clinic) =>
        clinic.clinicId.toString() === activeClinicId &&
        clinic.status === UserStatus.ACTIVE,
    );

    if (!clinicMembership) {
      throw new UnauthorizedException('You do not belong to this clinic.');
    }

    if (clinicMembership.roles.includes(Role.ADMIN)) {
      // No modifications to filters needed
    } else if (clinicMembership.roles.includes(Role.DOCTOR)) {
      filters.doctorId = user.id;
    } else if (clinicMembership.roles.includes(Role.PATIENT)) {
      filters.patientId = user.id;
    } else {
      throw new UnauthorizedException('Access Denied.');
    }

    return this.appointmentsService.findAppointments(activeClinicId, filters);
  }
}
