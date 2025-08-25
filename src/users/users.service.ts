import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async create(dto: CreateUserDto, roles?: Role[]): Promise<Omit<User, 'password'>> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');
    const password = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({
      email: dto.email,
      password,
      roles: roles && roles.length ? roles : [Role.MEMBER]
    });
    const saved = await this.repo.save(user);
    const { password: _, ...safe } = saved;
    return safe;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    const { password, ...safe } = u;
    return safe;
  }

  async listAll(): Promise<Omit<User, 'password'>[]> {
    const all = await this.repo.find();
    return all.map(({ password, ...rest }) => rest);
  }

  // Batch helper for DataLoader
  async findManyByIds(ids: string[]): Promise<User[]> {
    if (!ids.length) return [];
    const rows = await this.repo.findBy({ id: In(ids) });
    return rows;
  }
}
