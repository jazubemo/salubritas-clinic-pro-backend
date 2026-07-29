import { ClinicMembership } from 'src/clinic-memberships/entities/clinic-membership.entity';

export const getUserClinicRolesInObject = (
  activeClinicMemberships: ClinicMembership[],
) => {
  return activeClinicMemberships.reduce(
    (accumulatorClinicRoles, currentMembership) => {
      const clinicIdStr = String(currentMembership.clinicId);

      accumulatorClinicRoles[clinicIdStr] = currentMembership.roles;
      return accumulatorClinicRoles;
    },
    {},
  );
};
