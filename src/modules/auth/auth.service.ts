import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignInDto, SignUpDto, AuthDto } from './auth.dto';
import { Role, User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async signIn(signInDto: SignInDto): Promise<AuthDto> {
        const user = await this.usersService.findOne({phone: signInDto.phone});
        if (!user) {
            throw new UnauthorizedException('Incorrect phone number or password');
        }
        const isMatch = await bcrypt.compare(signInDto.password, user?.password);
        if (!isMatch) {
            throw new UnauthorizedException('Incorrect phone number or password');
        }
        const { password, ...result } = user;
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone,
            email: user.email,
            token: this.jwtService.sign(result),
        };
    }

    async signUp(signUpDto: SignUpDto): Promise<AuthDto> {
        let existed: User;
        existed = await this.usersService.findOne({phone: signUpDto.phone});
        if (existed) {
            throw new UnprocessableEntityException('Phone number already exists');
        }
        const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
        const user = await this.usersService.create({
            ...signUpDto,
            password: hashedPassword,
            role: Role.CUSTOMER,
        });
        const { password, ...result } = user;
        return {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone,
            email: user.email,
            token: this.jwtService.sign(result),
        }
    }
}
