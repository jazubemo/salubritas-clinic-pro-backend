import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsResolver } from './doctors.resolver';

import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [DoctorsResolver, DoctorsService],
  imports: [UsersModule],
})
export class DoctorsModule {}
