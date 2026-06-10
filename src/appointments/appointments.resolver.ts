import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AppointmentsService } from './appointments.service';

import { CreateAppointmentInput } from './dto/create-appointment.input';
import { UpdateAppointmentInput } from './dto/update-appointment.input';
import { AppointmentFiltersArgs } from './dto/get-appointments-filter.args';
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

@Resolver(() => Appointment)
@UseGuards(AuthGuard)
export class AppointmentsResolver {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Mutation(() => Appointment)
  createAppointment(
    @Args('createAppointmentInput')
    createAppointmentInput: CreateAppointmentInput,
  ) {
    return this.appointmentsService.create(createAppointmentInput);
  }

  @Query(() => [Appointment], { name: 'appointments' })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Query(() => Appointment, { name: 'appointment' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.appointmentsService.findOne(id);
  }

  @Mutation(() => Appointment)
  updateAppointment(
    @Args('updateAppointmentInput')
    updateAppointmentInput: UpdateAppointmentInput,
  ) {
    return this.appointmentsService.update(
      updateAppointmentInput.id,
      updateAppointmentInput,
    );
  }

  @Mutation(() => Appointment)
  removeAppointment(@Args('id', { type: () => Int }) id: number) {
    return this.appointmentsService.remove(id);
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @UseGuards(RolesGuard)
  @Query(() => [Appointment], { name: 'findTodayClinicAppointments' })
  @RequireDbUser()
  findTodayClinicAppointments(
    @Args() securityArgs: SecurityClinicArgs,
    @Args() filters: AppointmentFiltersArgs,
    @CurrentUser() user: User,
  ) {
    // double-checking security
    const clinicMembership = user.clinicMemberships.find(
      (clinic) => clinic.clinicId.toString() === securityArgs.activeClinicId,
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
    console.log('filters', filters);

    return this.appointmentsService.findTodayClinicAppointments(
      securityArgs.activeClinicId,
      filters,
    );
  }
}
