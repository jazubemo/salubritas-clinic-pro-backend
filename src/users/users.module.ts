import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClinicMembershipsResolver } from 'src/clinic-memberships/clinic-memberships.resolver';

@Module({
  imports: [PrismaModule],
  providers: [UsersResolver, UsersService, ClinicMembershipsResolver],
  exports: [UsersService],
})
export class UsersModule {}
