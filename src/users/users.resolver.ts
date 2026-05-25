import { Query, Resolver } from '@nestjs/graphql';
import { User } from './user.schema';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/firebase/guards/auth.guard';

import { UsersService } from './users.service';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  async getUsers(): Promise<User[]> {
    return await this.usersService.findAll();
  }
}
