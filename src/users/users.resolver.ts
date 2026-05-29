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
import { SecurityClinicArgs } from 'src/common/security/clinic-security.args';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => [User])
  async getUsers(@Args() securityArgs: SecurityClinicArgs): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Roles()
  @UseGuards(RolesGuard)
  @Query(() => String, { name: 'getHello' })
  getHello(@Args() securityArgs: SecurityClinicArgs): string {
    return `Hello there!`;
  }

  @Query(() => User)
  @RequireDbUser()
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
