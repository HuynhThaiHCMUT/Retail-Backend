import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import {
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common'

describe('AuthController', () => {
    let controller: AuthController
    let authService: jest.Mocked<AuthService>

    beforeEach(async () => {
        const mockAuthService = {
            signIn: jest.fn(),
            signUp: jest.fn(),
            verifyRefreshToken: jest.fn(),
        }

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        }).compile()

        controller = module.get<AuthController>(AuthController)
        authService = module.get(AuthService)
    })

    describe('signIn', () => {
        it('should return AuthDto for valid credentials', async () => {
            const result = {
                id: '1',
                name: 'name',
                phone: '0123456789',
                role: 'MANAGER',
                token: 'token',
                refreshToken: 'refresh',
            }
            authService.signIn.mockResolvedValue(result)

            const res = await controller.signIn({
                phone: '0123456789',
                password: '12345678',
            })

            expect(res).toEqual(result)
            expect(authService.signIn).toHaveBeenCalledWith({
                phone: '0123456789',
                password: '12345678',
            })
        })

        it('should throw UnauthorizedException for invalid credentials', async () => {
            authService.signIn.mockRejectedValue(new UnauthorizedException())
            await expect(
                controller.signIn({ phone: '0123', password: 'wrong' })
            ).rejects.toThrow(UnauthorizedException)
        })
    })

    describe('signUp', () => {
        it('should return AuthDto after successful registration', async () => {
            const dto = {
                name: 'A',
                phone: '0123456789',
                email: 'a@mail.com',
                password: '12345678',
            }
            const result = {
                id: '1',
                name: 'A',
                phone: '0123456789',
                role: 'MANAGER',
                token: 'token',
                refreshToken: 'refresh',
            }

            authService.signUp.mockResolvedValue(result)

            expect(await controller.signUp(dto)).toEqual(result)
            expect(authService.signUp).toHaveBeenCalledWith(dto)
        })

        it('should throw UnprocessableEntityException if phone/email exists', async () => {
            authService.signUp.mockRejectedValue(
                new UnprocessableEntityException()
            )
            await expect(
                controller.signUp({
                    name: 'A',
                    phone: '0123456789',
                    email: 'a@mail.com',
                    password: '12345678',
                })
            ).rejects.toThrow(UnprocessableEntityException)
        })
    })

    describe('refreshToken', () => {
        it('should return new tokens for valid refresh token', async () => {
            const resData = { token: 'newToken', refreshToken: 'newRefresh' }
            authService.verifyRefreshToken.mockResolvedValue(resData)

            const result = await controller.refreshToken({
                userId: '1',
                token: 'validRefresh',
            })
            expect(result).toEqual(resData)
            expect(authService.verifyRefreshToken).toHaveBeenCalledWith(
                'validRefresh'
            )
        })

        it('should throw UnauthorizedException for invalid token', async () => {
            authService.verifyRefreshToken.mockRejectedValue(
                new UnauthorizedException()
            )

            await expect(
                controller.refreshToken({ userId: '1', token: 'badToken' })
            ).rejects.toThrow(UnauthorizedException)
        })
    })
})
