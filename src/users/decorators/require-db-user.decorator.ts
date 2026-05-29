import { SetMetadata } from '@nestjs/common';

export const REQUIRE_DB_USER_KEY = 'requireDbUser';
export const RequireDbUser = () => SetMetadata(REQUIRE_DB_USER_KEY, true);
