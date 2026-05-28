import { Args, Query, Resolver } from '@nestjs/graphql';
import { User } from './user.schema';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/firebase/guards/auth.guard';

import { UsersService } from './users.service';
import { Roles } from 'src/firebase/decorators/roles.decorator';
import { RolesGuard } from 'src/firebase/guards/roles.guard';
import { Role } from './role.enum';
import { RequireDbUser } from 'src/users/decorators/require-db-user.decorator';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [User])
  async getUsers(
    @Args('activeClinicId', { type: () => String }) activeClinicId: string,
  ): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Query(() => User)
  @RequireDbUser()
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
