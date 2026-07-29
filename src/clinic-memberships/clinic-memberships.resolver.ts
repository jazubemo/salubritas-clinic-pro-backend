import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { ClinicMembership } from './entities/clinic-membership.entity';
import { Prisma } from '@prisma-custom';

type ClinicMembershipWithClinic = Prisma.ClinicMembershipGetPayload<{
  include: { clinic: true };
}>;

@Resolver(() => ClinicMembership)
export class ClinicMembershipsResolver {
  @ResolveField(() => String, { name: 'name' })
  getClinicName(@Parent() membership: ClinicMembershipWithClinic): string {
    return membership.clinic?.name ?? 'Unknown Clinic';
  }
}
