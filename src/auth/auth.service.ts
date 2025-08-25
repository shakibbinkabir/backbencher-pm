import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

  async validateUser(email: string, plain: string) {
    const u = await this.users.findByEmail(email);
    if (!u) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(plain, u.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return u;
  }

  async login(email: string, password: string) {
    const u = await this.validateUser(email, password);
    const payload = { sub: u.id, email: u.email, roles: u.roles as Role[] };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token };
  }
}
