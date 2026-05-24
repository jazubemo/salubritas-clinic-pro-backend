import { Query, Resolver } from '@nestjs/graphql';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/firebase/auth.guard';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UsersResolver {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  @Query(() => [User])
  async getUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
