import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignInDto, SignUpDto, AuthDto } from './auth.dto';
import { Role } from 'src/utils/enum';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async signIn(signInDto: SignInDto): Promise<AuthDto> {
        let user = await this.usersService.verify(signInDto);
        let userInfo = {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone,
            email: user.email,
        }
        return {
            ...userInfo,
            token: this.jwtService.sign(userInfo),
        }
    }

    async signUp(signUpDto: SignUpDto): Promise<AuthDto> {
        const user = await this.usersService.create({
            ...signUpDto,
            role: Role.CUSTOMER,
        });
        let userInfo = {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone,
            email: user.email,
        }
        return {
            ...userInfo,
            token: this.jwtService.sign(userInfo),
        }
    }
}
