import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import { SignInDto, SignUpDto, AuthDto, RefreshTokenDto, NewTokenDto } from './auth.dto'
import { Role } from 'src/utils/enum'
import { AUTH_ERRORS } from 'src/error/auth.error'

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async signIn(signInDto: SignInDto): Promise<AuthDto> {
        let user = await this.usersService.verify(signInDto)
        let userInfo = {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone,
            email: user.email,
        }
        return {
            ...userInfo,
            token: this.generateToken(userInfo),
            refreshToken: this.generateRefreshToken(userInfo.id),
        }
    }

    async signUp(signUpDto: SignUpDto): Promise<AuthDto> {
        const user = await this.usersService.create({
            ...signUpDto,
            role: Role.CUSTOMER,
        })
        let userInfo = {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone,
            email: user.email,
        }
        return {
            ...userInfo,
            token: this.generateToken(userInfo),
            refreshToken: this.generateRefreshToken(userInfo.id),
        }
    }

    generateToken(payload: any): string {
        return this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_EXPIRATION,
            secret: process.env.JWT_SECRET,
        });
    }

    generateRefreshToken(userId: any): string {
        return this.jwtService.sign({
            id: userId,
            version: process.env.JWT_REFRESH_VERSION,
        }, {
            expiresIn: process.env.JWT_REFRESH_EXPIRATION,
            secret: process.env.JWT_REFRESH_SECRET,
        });
    }

    async verifyRefreshToken(token: string): Promise<NewTokenDto> {
        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
            const user = await this.usersService.findOneDto(payload.id);
            return {
                token: this.generateToken(user),
                refreshToken: this.generateRefreshToken(user.id),
            };
        } catch (error) {
            throw new UnauthorizedException(AUTH_ERRORS.INVALID_REFRESH_TOKEN_ERROR);
        }
    }
}
