import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsResolver } from './patients.resolver';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [PatientsResolver, PatientsService],
  imports: [UsersModule],
})
export class PatientsModule {}
