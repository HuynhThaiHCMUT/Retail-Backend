import { Test, TestingModule } from '@nestjs/testing'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'

describe('CategoriesController', () => {
    let controller: CategoriesController
    let service: CategoriesService

    const mockCategoriesService = {
        get: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                {
                    provide: CategoriesService,
                    useValue: mockCategoriesService,
                },
            ],
        }).compile()

        controller = module.get<CategoriesController>(CategoriesController)
        service = module.get<CategoriesService>(CategoriesService)
    })

    it('should return an empty array when service returns empty', async () => {
        mockCategoriesService.get.mockResolvedValue([])

        const result = await controller.get()
        expect(result).toEqual([])
        expect(service.get).toHaveBeenCalled()
    })
})
