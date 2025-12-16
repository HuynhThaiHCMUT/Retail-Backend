import { OrdersService } from './orders.service'
import { Repository, EntityManager } from 'typeorm'
import { Order } from './order.entity'
import { Product } from '../products/product.entity'
import {
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common'

// Mocks helpers
const mockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    findAndCount: jest.fn(),
})

const mockManager = (repos: Record<string, any>) => ({
    getRepository: (entity: any) => {
        const name = entity.name
        return repos[name]
    },
})

// Minimal fake DTO conversion
class FakeOrder extends Order {
    toDto() {
        return {
            id: this.id,
            name: this.name,
            total: this.total,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            products: this.products?.map((item) => item.toDto()),
        }
    }
}

describe('OrdersService', () => {
    let ordersRepo: any
    let service: OrdersService

    beforeEach(() => {
        ordersRepo = mockRepository()
        // Inject ordersRepository via constructor mock
        const mockDataSource = {
            transaction: async (cb: any) => cb(service['__TEST_MANAGER__']),
        } as any
        service = new OrdersService(
            ordersRepo as Repository<Order>,
            mockDataSource
        )
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    it('findOne - success', async () => {
        const ord = new FakeOrder()
        ord.id = 'order-1'
        ord.name = '2410000001'
        ordersRepo.findOne.mockResolvedValue(ord)

        const res = await service.findOne('order-1')
        expect(res).toBe(ord)
        expect(ordersRepo.findOne).toHaveBeenCalledWith({
            where: { id: 'order-1' },
            relations: [
                'products',
                'products.product',
                'products.unit',
                'staff',
                'customer',
            ],
        })
    })

    it('findOne - not found throws', async () => {
        ordersRepo.findOne.mockResolvedValue(null)
        await expect(service.findOne('missing')).rejects.toThrow(
            NotFoundException
        )
    })

    it('processOrder - creates new order product with base unit price', async () => {
        // Setup fake manager and repositories
        const productRepo = mockRepository()
        const unitRepo = mockRepository()
        const orderProductRepo = mockRepository()
        const orderRepo = mockRepository()

        // product p1
        const p1 = new Product()
        p1.id = 'p1'
        p1.price = 10
        p1.baseUnit = 'piece'
        p1.units = []

        productRepo.find.mockResolvedValue([p1])
        unitRepo.findBy.mockResolvedValue([])
        orderProductRepo.find.mockResolvedValue([])

        // save on orderProductRepo returns saved OPs
        orderProductRepo.save.mockImplementation(async (ops) => {
            // emulate assigned ids
            ops.forEach((op: any, i: number) => (op.id = `op-${i + 1}`))
            return ops
        })

        // orderRepo.findOne used to determine latest order name
        orderRepo.findOne.mockResolvedValue(null)

        // orderRepo.save should return the order with toDto
        orderRepo.save.mockImplementation(async (order) => {
            const o = new FakeOrder()
            Object.assign(o, order)
            return o
        })

        const manager = mockManager({
            Product: productRepo,
            Unit: unitRepo,
            OrderProduct: orderProductRepo,
            Order: orderRepo,
        })

        const order = new Order()
        order.id = 'new-order'

        const dto = await service.processOrder(
            manager as unknown as EntityManager,
            order,
            [{ productId: 'p1', quantity: 2 }]
        )

        expect(dto.total).toBe(20)
        expect(orderProductRepo.save).toHaveBeenCalled()
        expect(orderRepo.save).toHaveBeenCalled()
    })

    it('processOrder - missing product throws', async () => {
        const productRepo = mockRepository()
        productRepo.find.mockResolvedValue([])
        const unitRepo = mockRepository()
        unitRepo.findBy.mockResolvedValue([])
        const orderProductRepo = mockRepository()
        orderProductRepo.find.mockResolvedValue([])
        const orderRepo = mockRepository()
        orderRepo.findOne.mockResolvedValue(null)

        const manager = mockManager({
            Product: productRepo,
            Unit: unitRepo,
            OrderProduct: orderProductRepo,
            Order: orderRepo,
        })
        const order = new Order()

        await expect(
            service.processOrder(manager as any, order, [
                { productId: 'missing', quantity: 1 },
            ])
        ).rejects.toThrow(NotFoundException)
    })

    it('createPOSOrder - unauthorized when staff missing', async () => {
        // dataSource.transaction will call our transaction implementation which uses __TEST_MANAGER__
        const userRepo = mockRepository()
        userRepo.findOneBy.mockResolvedValue(null)

        const orderRepo = mockRepository()
        const manager = mockManager({ User: userRepo, Order: orderRepo })
        service['__TEST_MANAGER__'] = manager

        await expect(
            service.createPOSOrder({ products: [] } as any, 'no-user')
        ).rejects.toThrow(UnauthorizedException)
    })

    it('createOnlineOrder - unauthorized when userId missing', async () => {
        const userRepo = mockRepository()
        const orderRepo = mockRepository()
        const manager = mockManager({ User: userRepo, Order: orderRepo })

        const mockDataSource = {
            transaction: async (cb: any) => cb(manager),
        } as any
        service = new OrdersService(
            ordersRepo as Repository<Order>,
            mockDataSource
        )
        service['__TEST_MANAGER__'] = manager

        await expect(
            service.createOnlineOrder({ products: [] } as any, '' as any)
        ).rejects.toThrow(UnauthorizedException)
    })

    it('updateOrder - staff updates status and calls processOrder when products provided', async () => {
        // findOne (service.findOne) should return an order in PENDING
        const existing = new FakeOrder()
        existing.id = 'order-1'
        existing.status = 'PENDING'

        // mock service.findOne to return existing
        jest.spyOn(service, 'findOne').mockResolvedValue(existing as any)

        const userRepo = mockRepository()
        userRepo.findOne.mockResolvedValue({ id: 'staff-1', role: 'STAFF' })

        const orderRepo = mockRepository()

        // processOrder should be called and return a DTO
        jest.spyOn(service, 'processOrder').mockResolvedValue({
            id: 'order-1',
            status: 'DONE',
        } as any)

        const manager = mockManager({ User: userRepo, Order: orderRepo })
        service['__TEST_MANAGER__'] = manager

        const result = await service.updateOrder(
            'order-1',
            {
                status: 'DONE',
                products: [{ productId: 'p1', quantity: 1 }],
            } as any,
            'staff-1'
        )
        expect(result).toEqual({ id: 'order-1', status: 'DONE' })
        expect(service.processOrder).toHaveBeenCalled()
    })

    it('closeOrder - throws when order already DONE', async () => {
        const orderRepo = mockRepository()
        orderRepo.findOne.mockResolvedValue({
            id: 'order-done',
            status: 'DONE',
        })
        const userRepo = mockRepository()
        userRepo.findOne.mockResolvedValue({ id: 'staff-1', role: 'STAFF' })

        const manager = mockManager({ User: userRepo, Order: orderRepo })
        service['__TEST_MANAGER__'] = manager

        // Override dataSource.transaction to use our manager for this test
        await expect(
            service.closeOrder('order-done', 'staff-1')
        ).rejects.toThrow(UnprocessableEntityException)
    })

    it('deleteOrder - calls softDelete', async () => {
        ordersRepo.findOne.mockResolvedValue({ id: 'order-1' })
        ordersRepo.softDelete.mockResolvedValue(undefined)
        await expect(
            service.deleteOrder('order-1', 'u1')
        ).resolves.toBeUndefined()
        expect(ordersRepo.softDelete).toHaveBeenCalledWith('order-1')
    })

    it('get - returns mapped DTOs', async () => {
        const o1 = new FakeOrder()
        o1.id = 'o1'
        o1.total = 5
        const o2 = new FakeOrder()
        o2.id = 'o2'
        o2.total = 10
        ordersRepo.findAndCount.mockResolvedValue([[o1, o2], 2])

        const res = await service.get(0, 2)
        expect(res).toEqual({
            items: [
                { id: 'o1', name: o1.name, total: 5, status: o1.status },
                { id: 'o2', name: o2.name, total: 10, status: o2.status },
            ],
            totalCount: 2,
        })
    })
})
