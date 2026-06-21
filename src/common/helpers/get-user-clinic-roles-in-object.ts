import { ClinicMembership } from 'src/users/schemas/clinic-membership.schema';

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
