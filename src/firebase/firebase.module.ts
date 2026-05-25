import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { UsersModule } from 'src/users/users.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DbUserInterceptor } from './interceptors/db-user.interceptor';

@Global()
@Module({
  imports: [UsersModule],
  providers: [
    FirebaseService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DbUserInterceptor,
    },
  ],
  exports: [FirebaseService],
})
export class FirebaseModule {}
