import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { AppointmentsService } from './appointments.service';

import { CreateAppointmentInput } from './inputs/create-appointment.input';
import { UpdateAppointmentInput } from './inputs/update-appointment.input';
import { AppointmentFiltersArgs } from './args/get-appointments-filter.args';
import { Appointment } from './schemas/appointment.schema';
import { Roles } from 'src/firebase/decorators/roles.decorator';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/firebase/guards/roles.guard';
import { Role } from 'src/users/enums/role.enum';
import { AuthGuard } from 'src/firebase/auth.guard';
import { SecurityClinicArgs } from 'src/common/security/clinic-security.args';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { User } from 'src/users/schemas/user.schema';
import { RequireDbUser } from 'src/users/decorators/require-db-user.decorator';
import { UserStatus } from 'src/users/enums/user-status.enum';

@Resolver(() => Appointment)
@UseGuards(AuthGuard)
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(Role.ADMIN, Role.DOCTOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Appointment)
  @RequireDbUser()
  createAppointment(
    @Args() securityArgs: SecurityClinicArgs,
    @Args('createAppointmentInput')
    createAppointmentInput: CreateAppointmentInput,
    @CurrentUser() user: User,
  ) {
    const clinicMembership = user.clinicMemberships.find(
      (clinic) =>
        clinic.clinicId.toString() ===
          createAppointmentInput.clinicId.toString() &&
        clinic.status === UserStatus.ACTIVE,
    );

    if (!clinicMembership) {
      throw new UnauthorizedException('You do not belong to this clinic.');
    }

    // double-check security
    if (clinicMembership.roles.includes(Role.ADMIN)) {
      // No modifications to filters needed
    } else if (clinicMembership.roles.includes(Role.DOCTOR)) {
      createAppointmentInput.doctorId = user._id;
    } else {
      throw new UnauthorizedException('Access Denied.');
    }
    return this.appointmentsService.create(createAppointmentInput);
  }

  @Roles(Role.ADMIN, Role.DOCTOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Appointment)
  updateAppointment(
    @Args() securityArgs: SecurityClinicArgs,
    @Args('id', { type: () => ID }) id: string,
    @Args('updateAppointmentInput')
    updateAppointmentInput: UpdateAppointmentInput,
  ) {
    return this.appointmentsService.updateAppointment(
      id,
      updateAppointmentInput,
    );
  }

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
    const clinicMembership = user.clinicMemberships.find(
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
      filters.doctorId = user._id.toString();
    } else if (clinicMembership.roles.includes(Role.PATIENT)) {
      filters.patientId = user._id.toString();
    } else {
      throw new UnauthorizedException('Access Denied.');
    }

    return this.appointmentsService.findAppointments(activeClinicId, filters);
  }
}
