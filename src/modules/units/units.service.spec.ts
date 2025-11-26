import { Test, TestingModule } from '@nestjs/testing'
import { UnitsService } from './units.service'
import { Unit } from './unit.entity'
import { getRepositoryToken } from '@nestjs/typeorm'

const mockRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
}

const mockUnits = [
    { name: 'Small', weight: 100, price: 10, enabled: true },
    { name: 'Large', weight: 200, price: 18, enabled: true },
]

describe('UnitsService', () => {
    let service: UnitsService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UnitsService,
                { provide: getRepositoryToken(Unit), useValue: mockRepository },
            ],
        }).compile()

        service = module.get<UnitsService>(UnitsService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('createFromArray', () => {
        it('should return empty array if data is null', async () => {
            const res = await service.createFromArray(null)
            expect(res).toEqual([])
            expect(mockRepository.save).not.toHaveBeenCalled()
        })

        it('should save units directly if no productId', async () => {
            mockRepository.save.mockResolvedValue(mockUnits)

            const res = await service.createFromArray(mockUnits, null)

            expect(mockRepository.save).toHaveBeenCalledWith(mockUnits)
            expect(res).toEqual(mockUnits)
        })

        it('should update existing units and create new ones', async () => {
            mockRepository.find.mockResolvedValue([
                { name: 'Small', weight: 90, price: 9, enabled: true },
            ])

            mockRepository.create.mockImplementation((e) => e)
            mockRepository.save.mockImplementation((e) => e)

            const res = await service.createFromArray(mockUnits, 'product123')

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { product: { id: 'product123' } },
            })
            expect(mockRepository.save).toHaveBeenCalledTimes(2)
            expect(res.length).toBe(2)
        })
    })

    describe('deleteByProductId', () => {
        it('should call softDelete with productId', async () => {
            await service.deleteByProductId('p1')
            expect(mockRepository.softDelete).toBeCalledWith({
                product: { id: 'p1' },
            })
        })
    })
})
