import { Test, TestingModule } from '@nestjs/testing'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'

describe('ReportsController', () => {
    let controller: ReportsController
    let service: ReportsService

    const mockReportsService = {
        getSummary: jest.fn(),
        getTopSold: jest.fn(),
        getChart: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReportsController],
            providers: [
                { provide: ReportsService, useValue: mockReportsService },
            ],
        }).compile()

        controller = module.get<ReportsController>(ReportsController)
        service = module.get<ReportsService>(ReportsService)
    })

    it('should return summary', async () => {
        mockReportsService.getSummary.mockResolvedValue({
            revenue: 100,
            profit: 50,
            ordersCount: 2,
            productsCount: 5,
        })

        const result = await controller.summary({
            range: 'month',
            date: '2025-10-01',
        })
        expect(result.revenue).toBe(100)
        expect(service.getSummary).toHaveBeenCalledWith('month', '2025-10-01')
    })

    it('should return top sold items', async () => {
        mockReportsService.getTopSold.mockResolvedValue([
            { id: 1, name: 'Cafe', amountSold: 5 },
        ])

        const result = await controller.topSold({
            range: 'month',
            date: '2025-10-01',
        })
        expect(result.length).toBe(1)
        expect(service.getTopSold).toHaveBeenCalledWith('month', '2025-10-01')
    })

    it('should return chart data', async () => {
        mockReportsService.getChart.mockResolvedValue([
            { label: '0:00', value: 0 },
        ])

        const result = await controller.chart({
            metric: 'revenue',
            range: 'day',
            date: '2025-10-10',
        })

        expect(result.length).toBe(1)
        expect(service.getChart).toHaveBeenCalledWith(
            'revenue',
            'day',
            '2025-10-10'
        )
    })
})
