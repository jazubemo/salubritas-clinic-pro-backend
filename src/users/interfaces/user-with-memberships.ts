export interface UserWithMemberships {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  authId: string;
  email: string;
  createdAt: Date;
  updatedAt: Date | null;
  clinicMemberships: any[];
}
