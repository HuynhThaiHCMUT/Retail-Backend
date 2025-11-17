// reports.service.spec.ts
import { ReportsService } from './reports.service'
import { Repository } from 'typeorm'
import { ProductsService } from '../products/products.service'
import { Order } from '../orders/order.entity'
import { OrderProduct } from '../orders/order-product.entity'

// Mock the date-range utils used by the service
jest.mock('src/utils/date-range', () => ({
    getRangeForFilter: jest.fn(() => ({
        start: '2025-10-01',
        end: '2025-10-31',
    })),
    toLocalTz: (col: string) => col,
}))

type MockQB = any

function createMockQB(returnOne?: any, returnMany?: any): MockQB {
    const qb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(returnOne),
        getRawMany: jest.fn().mockResolvedValue(returnMany),
    }
    return qb
}

describe('ReportsService', () => {
    let service: ReportsService
    let orderRepo: Partial<Repository<Order>>
    let opRepo: Partial<Repository<OrderProduct>>
    let productsService: Partial<ProductsService>

    beforeEach(() => {
        orderRepo = {
            createQueryBuilder: jest.fn(),
        }
        opRepo = {
            createQueryBuilder: jest.fn(),
        }
        productsService = {
            getPicturesById: jest.fn(),
        }

        service = new ReportsService(
            orderRepo as any,
            opRepo as any,
            productsService as any
        )
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('getSummary should return parsed numeric fields', async () => {
        // mock orderRepo query (revenue + ordersCount)
        const orderQB = createMockQB({ revenue: '200', ordersCount: '3' }, null)
        ;(orderRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(
            orderQB
        )

        // mock opRepo query (profit + productsCount)
        const opQB = createMockQB({ profit: '50', productsCount: '10' }, null)
        ;(opRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(opQB)

        const res = await service.getSummary('month', '2025-10-01')

        expect(res).toEqual({
            revenue: 200,
            profit: 50,
            ordersCount: 3,
            productsCount: 10,
        })

        // ensure query builders were called
        expect(orderRepo.createQueryBuilder).toHaveBeenCalled()
        expect(opRepo.createQueryBuilder).toHaveBeenCalled()
    })

    it('stripProductPrefix should remove prefix "product_" correctly', () => {
        const row = { product_id: 2, product_name: 'Trà sữa', other: 'x' }
        const out = service.stripProductPrefix(row as any)
        expect(out).toEqual({ id: 2, name: 'Trà sữa', other: 'x' })
    })

    it('getTopSold should map rows, call productsService and return amountSold as number and pictures', async () => {
        // simulate rows returned by opRepo.getRawMany
        const rawRows = [
            { product_id: 1, product_name: 'Cà phê', amountSold: '5' },
            { product_id: 2, product_name: 'Trà', amountSold: '3' },
        ]
        const opQB = createMockQB(null, rawRows)
        ;(opRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(opQB)
        ;(productsService.getPicturesById as jest.Mock).mockImplementation(
            async (id: number) => {
                if (id === 1) return ['p1']
                if (id === 2) return ['p2']
                return []
            }
        )

        const top = await service.getTopSold('month', '2025-10-01', 10)

        expect(top).toHaveLength(2)
        expect(top[0]).toMatchObject({
            id: 1,
            name: 'Cà phê',
            amountSold: 5,
            pictures: ['p1'],
        })
        expect(top[1]).toMatchObject({
            id: 2,
            name: 'Trà',
            amountSold: 3,
            pictures: ['p2'],
        })

        expect(opRepo.createQueryBuilder).toHaveBeenCalled()
        expect(productsService.getPicturesById).toHaveBeenCalledTimes(2)
    })

    it('getChart (day, revenue) should build 24 buckets and fill values from orderRepo rows', async () => {
        // Simulate orderRepo rows for day revenue (hour,value)
        const rows = [
            { hour: '2', value: '100' },
            { hour: '14', value: '30' },
        ]
        const orderQB = createMockQB(null, rows)
        ;(orderRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(
            orderQB
        )

        const chart = await service.getChart('revenue', 'day', '2025-10-15')

        expect(chart).toHaveLength(24)
        // check specific filled buckets
        expect(chart.find((c) => c.label === '2:00')!.value).toBe(100)
        expect(chart.find((c) => c.label === '14:00')!.value).toBe(30)
        // random other hour zero
        expect(chart.find((c) => c.label === '0:00')!.value).toBe(0)
    })

    it('getChart (day, profit) should use opRepo and produce 24 buckets', async () => {
        const rows = [{ hour: '8', value: '40' }]
        const opQB = createMockQB(null, rows)
        ;(opRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(opQB)

        const chart = await service.getChart('profit', 'day', '2025-10-15')

        expect(chart).toHaveLength(24)
        expect(chart.find((c) => c.label === '8:00')!.value).toBe(40)
        expect(chart.find((c) => c.label === '7:00')!.value).toBe(0)
    })
})
