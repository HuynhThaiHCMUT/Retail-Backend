import { OrdersController } from './orders.controller'

// Mock OrdersService
const mockOrdersService = () => ({
    findOneDto: jest.fn(),
    get: jest.fn(),
    createPOSOrder: jest.fn(),
    createOnlineOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
})

describe('OrdersController', () => {
    let controller: OrdersController
    let service: ReturnType<typeof mockOrdersService>

    beforeEach(() => {
        service = mockOrdersService()
        controller = new OrdersController(service as any)
    })

    it('getOrderById', async () => {
        service.findOneDto.mockResolvedValue({ id: 'o1' })
        const res = await controller.getOrderById('o1')
        expect(service.findOneDto).toHaveBeenCalledWith('o1')
        expect(res).toEqual({ id: 'o1' })
    })

    it('getOrders', async () => {
        service.get.mockResolvedValue({ orders: [], totalCount: 0 })
        await controller.getOrders({ offset: 0, limit: 10 })
        expect(service.get).toHaveBeenCalledWith(
            0,
            10,
            undefined,
            undefined,
            undefined,
            undefined
        )
    })

    it('createOrder', async () => {
        service.createPOSOrder.mockResolvedValue({ id: 'pos1' })
        const req: any = { user: { id: 'u1' } }
        const dto = { products: [] }
        const res = await controller.createOrder(dto as any, req)
        expect(service.createPOSOrder).toHaveBeenCalledWith(dto, 'u1')
        expect(res).toEqual({ id: 'pos1' })
    })

    it('createOnlineOrder', async () => {
        service.createOnlineOrder.mockResolvedValue({ id: 'on1' })
        const req: any = { user: { id: 'u2' } }
        const dto = { products: [] }
        const res = await controller.createOnlineOrder(dto as any, req)
        expect(service.createOnlineOrder).toHaveBeenCalledWith(dto, 'u2')
        expect(res).toEqual({ id: 'on1' })
    })

    it('updateOrder', async () => {
        service.updateOrder.mockResolvedValue({ id: 'o1', status: 'DONE' })
        const req: any = { user: { id: 'staff1' } }
        const body = { status: 'DONE' }
        const res = await controller.updateOrder('o1', body as any, req)
        expect(service.updateOrder).toHaveBeenCalledWith('o1', body, 'staff1')
        expect(res).toEqual({ id: 'o1', status: 'DONE' })
    })

    it('deleteOrder', async () => {
        service.deleteOrder.mockResolvedValue(undefined)
        await expect(controller.deleteOrder('o123')).resolves.toBeUndefined()
        expect(service.deleteOrder).toHaveBeenCalledWith('o123')
    })
})
