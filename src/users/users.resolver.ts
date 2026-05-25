import { Query, Resolver } from '@nestjs/graphql';
import { User } from './user.schema';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/firebase/guards/auth.guard';

import { UserService } from './users.service';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UsersResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  async getUsers(): Promise<User[]> {
    return await this.userService.findAll();
  }
}
