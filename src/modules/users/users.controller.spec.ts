import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

const mockUsersService = {
    get: jest.fn(),
    findOneDto: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    uploadAvatar: jest.fn(),
}

describe('UsersController', () => {
    let controller: UsersController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockUsersService }],
        }).compile()

        controller = module.get<UsersController>(UsersController)
    })

    afterEach(() => jest.clearAllMocks())

    it('should return users list', async () => {
        mockUsersService.get.mockResolvedValue([{ id: '1' }])
        const result = await controller.getUsers(0, 10)
        expect(result).toEqual([{ id: '1' }])
    })

    it('should return user by id', async () => {
        mockUsersService.findOneDto.mockResolvedValue({ id: '1' })
        const result = await controller.getUser('1')
        expect(result).toEqual({ id: '1' })
    })

    it('should create user & default role EMPLOYEE', async () => {
        const body = { name: 'A', phone: '123', password: 'abc' }
        mockUsersService.create.mockResolvedValue({ id: '1', role: 'EMPLOYEE' })

        const result = await controller.createUser(body)

        expect(mockUsersService.create).toHaveBeenCalledWith({
            ...body,
            role: 'EMPLOYEE',
        })
        expect(result).toEqual({ id: '1', role: 'EMPLOYEE' })
    })

    it('should update user', async () => {
        mockUsersService.update.mockResolvedValue({ id: '1' })
        const result = await controller.updateUser('1', { phone: '555' })
        expect(result).toEqual({ id: '1' })
    })

    it('should delete user', async () => {
        mockUsersService.delete.mockResolvedValue(undefined)
        await controller.deleteUser('1')
        expect(mockUsersService.delete).toHaveBeenCalledWith('1')
    })

    it('should upload avatar when file provided', async () => {
        const file = { filename: '1.jpg' } as Express.Multer.File
        mockUsersService.uploadAvatar.mockResolvedValue('1.jpg')

        const result = await controller.uploadAvatar('1', file)
        expect(result).toBe('1.jpg')
    })
})
