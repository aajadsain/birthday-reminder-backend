import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createUser(data: any) {
    const exists = await this.userModel.findOne({ email: data.email });
    if (exists) {
      throw new ConflictException('Email already registered');
    }
    return this.userModel.create(data);
  }

  async getAll() {
    return this.userModel.find();
  }
}
