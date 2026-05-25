import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema'; // Adjust path to your Mongoose schema
import { Status } from './status.enum';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findOne(filter: Record<string, any>): Promise<User | null> {
    const dbUser = await this.userModel.findOne(filter).exec();

    if (!dbUser) {
      throw new UnauthorizedException('User profile not found in database.');
    }

    if (dbUser.status === Status.ARCHIVED.toString()) {
      throw new UnauthorizedException('Your account has been suspended.');
    }

    return dbUser;
  }
}
