import { Controller, Post, Get, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Body() body: any) {
    return this.usersService.createUser(body);
  }

  @Get()
  async getAll() {
    return this.usersService.getAll();
  }
}
