import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { Product } from './product.entity'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CategoriesService } from '../categories/categories.service'
import { UnitsService } from '../units/units.service'
import { NotFoundException } from '@nestjs/common'

const mockProduct = {
    id: '123',
    name: 'Test Product',
    price: 100,
    toDto: jest
        .fn()
        .mockReturnValue({ id: '123', name: 'Test Product', price: 100 }),
}

const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn().mockReturnValue(mockProduct),
    softDelete: jest.fn(),
    findAndCount: jest.fn(),
}

const mockCategoriesService = {
    createFromArray: jest.fn().mockResolvedValue([]),
    deleteUnused: jest.fn(),
}

const mockUnitsService = {
    createFromArray: jest.fn().mockResolvedValue([]),
    deleteByProductId: jest.fn(),
}

jest.mock('typeorm', () => {
    const actual = jest.requireActual('typeorm')
    return {
        ...actual,
        Entity: () => () => {},
        Column: () => () => {},
        PrimaryGeneratedColumn: () => () => {},
        ManyToMany: () => () => {},
        JoinTable: () => () => {},
        CreateDateColumn: () => () => {},
        UpdateDateColumn: () => () => {},
    }
})

describe('ProductsService', () => {
    let service: ProductsService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                {
                    provide: getRepositoryToken(Product),
                    useValue: mockRepository,
                },
                { provide: CategoriesService, useValue: mockCategoriesService },
                { provide: UnitsService, useValue: mockUnitsService },
            ],
        }).compile()

        service = module.get<ProductsService>(ProductsService)
    })

    describe('findOne', () => {
        it('should return one product', async () => {
            mockRepository.findOne.mockResolvedValue(mockProduct)

            const result = await service.findOne('123')
            expect(result).toEqual(mockProduct)
        })

        it('should throw NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null)

            await expect(service.findOne('none')).rejects.toThrow(
                NotFoundException
            )
        })
    })

    describe('create', () => {
        it('should create product', async () => {
            mockRepository.save.mockResolvedValue(mockProduct)

            const result = await service.create({ name: 'A', price: 100 })
            expect(result).toEqual(mockProduct.toDto())
        })
    })

    describe('update', () => {
        it('should update product', async () => {
            mockRepository.findOne.mockResolvedValue(mockProduct)
            mockRepository.save.mockResolvedValue(mockProduct)

            const result = await service.update('123', { name: 'Updated' })
            expect(result).toEqual(mockProduct.toDto())
        })
    })

    describe('delete', () => {
        it('should soft delete product', async () => {
            mockRepository.findOne.mockResolvedValue(mockProduct)

            await service.delete('123')
            expect(mockRepository.softDelete).toBeCalledWith('123')
        })
    })

    describe('get', () => {
        it('should return list of product dto', async () => {
            mockRepository.findAndCount.mockResolvedValue([[mockProduct], 1])
            const result = await service.get()
            expect(result.items.length).toBe(1)
        })
    })
})
