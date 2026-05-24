import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Global() // Makes it easily accessible across other modules like Users
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
