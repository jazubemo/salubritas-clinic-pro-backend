//   @Roles(Role.ADMIN, Role.DOCTOR)
//   @UseGuards(RolesGuard)
//   @Mutation(() => Appointment)
//   @RequireDbUser()
//   createAppointment(
//     @Args() securityArgs: SecurityClinicArgs,
//     @Args('createAppointmentInput')
//     createAppointmentInput: CreateAppointmentInput,
//     @CurrentUser() user: User,
//   ) {
//     const clinicMembership = user.clinicMemberships.find(
//       (clinic) =>
//         clinic.clinicId.toString() ===
//           createAppointmentInput.clinicId.toString() &&
//         clinic.status === UserStatus.ACTIVE,
//     );

//     if (!clinicMembership) {
//       throw new UnauthorizedException('You do not belong to this clinic.');
//     }

//     // double-check security
//     if (clinicMembership.roles.includes(Role.ADMIN)) {
//       // No modifications to filters needed
//     } else if (clinicMembership.roles.includes(Role.DOCTOR)) {
//       createAppointmentInput.doctorId = user._id;
//     } else {
//       throw new UnauthorizedException('Access Denied.');
//     }
//     return this.appointmentsService.create(createAppointmentInput);
//   }

//   @Roles(Role.ADMIN, Role.DOCTOR)
//   @UseGuards(RolesGuard)
//   @Mutation(() => Appointment)
//   updateAppointment(
//     @Args() securityArgs: SecurityClinicArgs,
//     @Args('id', { type: () => ID }) id: string,
//     @Args('updateAppointmentInput')
//     updateAppointmentInput: UpdateAppointmentInput,
//   ) {
//     return this.appointmentsService.updateAppointment(
//       id,
//       updateAppointmentInput,
//     );
//   }