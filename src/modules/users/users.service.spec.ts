import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from './user.entity'
import {
    UnauthorizedException,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'

jest.mock('bcrypt')

const mockRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
}

const mockUser = {
    id: '1',
    phone: '123',
    password: 'hashed',
    toDto: jest.fn().mockReturnValue({ id: '1', phone: '123' }),
}

describe('UsersService', () => {
    let service: UsersService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: mockRepository },
            ],
        }).compile()

        service = module.get<UsersService>(UsersService)
    })

    afterEach(() => jest.clearAllMocks())

    it('should find a user', async () => {
        mockRepository.findOne.mockResolvedValue(mockUser)

        const result = await service.findOne('1')
        expect(result).toEqual(mockUser)
    })

    it('should throw NotFoundException if user not found', async () => {
        mockRepository.findOne.mockResolvedValue(null)
        await expect(service.findOne('1')).rejects.toThrow(NotFoundException)
    })

    it('should verify user successfully', async () => {
        mockRepository.findOneBy.mockResolvedValue(mockUser)
        ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

        const result = await service.verify({ phone: '123', password: 'abc' })
        expect(result).toEqual({ id: '1', phone: '123' })
    })

    it('should throw UnauthorizedException on wrong password', async () => {
        mockRepository.findOneBy.mockResolvedValue(mockUser)
        ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

        await expect(
            service.verify({ phone: '123', password: 'wrong' })
        ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when phone does not exist', async () => {
        mockRepository.findOneBy.mockResolvedValue(null)

        await expect(
            service.verify({ phone: 'not-exist', password: 'abc' })
        ).rejects.toThrow(UnauthorizedException)
    })

    it('should create user successfully', async () => {
        mockRepository.findOneBy.mockResolvedValue(null)
        ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed')

        mockRepository.create.mockReturnValue(mockUser)
        mockRepository.save.mockResolvedValue(mockUser)

        const result = await service.create({
            name: 'A',
            phone: '123',
            password: 'abc',
        })
        expect(result).toEqual({ id: '1', phone: '123' })
    })

    it('should throw error on duplicate phone', async () => {
        mockRepository.findOneBy.mockResolvedValue(mockUser)
        await expect(
            service.create({
                name: 'A',
                phone: '123',
                password: 'abc',
            })
        ).rejects.toThrow(UnprocessableEntityException)
    })

    it('should update user', async () => {
        mockRepository.findOne.mockResolvedValue(mockUser)
        mockRepository.save.mockResolvedValue(mockUser)

        const result = await service.update('1', { phone: '555' })
        expect(result).toEqual({ id: '1', phone: '123' })
    })

    it('should upload avatar', async () => {
        mockRepository.findOne.mockResolvedValue(mockUser)
        mockRepository.save.mockResolvedValue(mockUser)

        const result = await service.uploadAvatar('1', 'pic.jpg')
        expect(result).toBe('pic.jpg')
    })

    it('should delete user', async () => {
        mockRepository.findOne.mockResolvedValue(mockUser)

        await service.delete('1')
        expect(mockRepository.softRemove).toHaveBeenCalled()
    })
})
