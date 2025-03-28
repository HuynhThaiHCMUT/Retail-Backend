import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common'
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { SignInDto, SignUpDto, AuthDto, RefreshTokenDto, NewTokenDto } from './auth.dto'
import { Public } from './auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('sign-in')
    @ApiOkResponse({
        description: 'User signed in successfully',
        type: AuthDto,
    })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({
        description: 'Incorrect phone number or password',
    })
    signIn(@Body() signInDto: SignInDto): Promise<AuthDto> {
        return this.authService.signIn(signInDto)
    }

    @Public()
    @HttpCode(HttpStatus.CREATED)
    @Post('sign-up')
    @ApiCreatedResponse({
        description: 'User signed up successfully',
        type: AuthDto,
    })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnprocessableEntityResponse({
        description: 'Phone number or email already exists',
    })
    signUp(@Body() signUpDto: SignUpDto): Promise<AuthDto> {
        return this.authService.signUp(signUpDto)
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    @ApiOkResponse({
        description: 'Refresh token successfully',
        type: NewTokenDto,
    })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({
        description: 'Invalid refresh token',
    })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<NewTokenDto> {
        const { token } = refreshTokenDto;
        return this.authService.verifyRefreshToken(token);
    }
}
