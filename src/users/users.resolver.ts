import { Args, Query, Resolver } from '@nestjs/graphql';
import { User } from './user.schema';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/firebase/guards/auth.guard';

import { UsersService } from './users.service';
import { Roles } from 'src/firebase/decorators/roles.decorator';
import { RolesGuard } from 'src/firebase/guards/roles.guard';
import { Role } from './role.enum';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.DOCTOR)
  @UseGuards(RolesGuard)
  @Query(() => [User])
  async getUsers(
    @Args('activeClinicId', { type: () => String }) activeClinicId: string,
  ): Promise<User[]> {
    return await this.usersService.findAll();
  }
}
