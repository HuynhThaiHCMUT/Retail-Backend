import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import { AUTH_ERRORS } from 'src/error/auth.error'

describe('AuthService', () => {
    let authService: AuthService
    let usersService: jest.Mocked<UsersService>
    let jwtService: jest.Mocked<JwtService>

    beforeEach(() => {
        usersService = {
            verify: jest.fn(),
            create: jest.fn(),
            findOneDto: jest.fn(),
        } as any

        jwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
        } as any

        authService = new AuthService(usersService, jwtService)

        process.env.JWT_SECRET = 'secret'
        process.env.JWT_EXPIRATION = '1h'
        process.env.JWT_REFRESH_SECRET = 'refresh_secret'
        process.env.JWT_REFRESH_EXPIRATION = '7d'
        process.env.JWT_REFRESH_VERSION = '1'
    })

    describe('signIn', () => {
        it('should return auth data when credentials are valid', async () => {
            const mockUser = {
                id: '1',
                name: 'A',
                role: 'CUSTOMER',
                phone: '0123',
                email: 'a@mail.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            usersService.verify.mockResolvedValue(mockUser)
            jwtService.sign
                .mockReturnValueOnce('token')
                .mockReturnValueOnce('refreshToken')

            const res = await authService.signIn({
                phone: '0123',
                password: '123',
            })
            expect(res.token).toBe('token')
            expect(res.refreshToken).toBe('refreshToken')
            expect(usersService.verify).toHaveBeenCalled()
        })

        it('should throw UnauthorizedException for invalid credentials', async () => {
            usersService.verify.mockRejectedValue(new UnauthorizedException())
            await expect(
                authService.signIn({ phone: '0123', password: 'wrong' })
            ).rejects.toThrow(UnauthorizedException)
        })
    })

    describe('signUp', () => {
        it('should create user and return tokens', async () => {
            const mockUser = {
                id: '1',
                name: 'A',
                role: 'CUSTOMER',
                phone: '0123',
                email: 'a@mail.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            usersService.create.mockResolvedValue(mockUser)
            jwtService.sign
                .mockReturnValueOnce('token')
                .mockReturnValueOnce('refreshToken')

            const res = await authService.signUp({
                name: 'A',
                phone: '0123',
                email: 'a@mail.com',
                password: '123',
            })
            expect(res.token).toBe('token')
            expect(usersService.create).toHaveBeenCalled()
        })
    })

    describe('verifyRefreshToken', () => {
        it('should return new tokens for valid refresh token', async () => {
            const mockUser = {
                id: '1',
                name: 'A',
                role: 'CUSTOMER',
                phone: '0123',
                email: 'a@mail.com',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            jwtService.verify.mockReturnValue({ id: 1 })
            usersService.findOneDto.mockResolvedValue(mockUser)
            jwtService.sign
                .mockReturnValueOnce('token')
                .mockReturnValueOnce('refreshToken')

            const res = await authService.verifyRefreshToken('valid')
            expect(res.token).toBe('token')
        })

        it('should throw UnauthorizedException for invalid token', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error()
            })

            await expect(
                authService.verifyRefreshToken('invalid')
            ).rejects.toThrow(
                new UnauthorizedException(
                    AUTH_ERRORS.INVALID_REFRESH_TOKEN_ERROR
                )
            )
        })
    })
})
