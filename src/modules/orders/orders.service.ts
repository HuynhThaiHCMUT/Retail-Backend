import {
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common'
import {
    DataSource,
    EntityManager,
    FindOptionsWhere,
    In,
    IsNull,
    Not,
    Repository,
} from 'typeorm'
import { Order } from './order.entity'
import { OrderProduct } from './order-product.entity'
import {
    CreateOnlineOrderDto,
    CreatePOSOrderDto,
    OrderDto,
    UpdateOrderDto,
} from './order.dto'
import { Product } from '../products/product.entity'
import { User } from '../users/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import {
    CreateOrderProductDto,
    UpdateOrderProductDto,
} from './order-product.dto'
import { OrderStatus, Role } from 'src/utils/enum'
import { ORDER_ERRORS } from 'src/error/order.error'
import { Unit } from '../units/unit.entity'

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name)
    constructor(
        @InjectRepository(Order)
        private readonly ordersRepository: Repository<Order>,
        private dataSource: DataSource
    ) {}

    async findOne(id: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id },
            relations: [
                'products',
                'products.product',
                'products.unit',
                'staff',
                'customer',
            ],
        })
        if (!order)
            throw new NotFoundException(ORDER_ERRORS.ORDER_NOT_FOUND_ERROR)
        return order
    }

    async findOneDto(id: string): Promise<OrderDto> {
        return (await this.findOne(id)).toDto()
    }

    async processOrder(
        manager: EntityManager,
        order: Order,
        products: (CreateOrderProductDto | UpdateOrderProductDto)[],
        { useCustomPrice = false }: { useCustomPrice?: boolean } = {}
    ): Promise<OrderDto> {
        const orderProductRepo = manager.getRepository(OrderProduct)
        const orderRepo = manager.getRepository(Order)

        // Generate order name with format "YYMXXXXXXX" where x is incremental
        const latestOrder = await orderRepo.findOne({
            where: { name: Not('') },
            order: { createdAt: 'DESC' },
        })
        let orderName =
            new Date().getFullYear().toString().slice(2) +
            (new Date().getMonth() + 1)
        if (latestOrder) {
            const latestOrderNumber = parseInt(latestOrder.name.slice(3), 10)
            const nextOrderNumber = latestOrderNumber + 1
            orderName += nextOrderNumber.toString().padStart(7, '0')
        } else {
            orderName += '0000001' // First order of the month
        }
        order.name = orderName

        // Bulk load products, units and order products
        const productIds = products.map((p) => p.productId).filter(Boolean)
        const unitNames = products.map((p) => p.unitName).filter(Boolean)
        const orderProductIds = products
            .map((p) => ('id' in p ? p.id : null))
            .filter(Boolean)
        const productMap = new Map(
            (
                await manager.getRepository(Product).find({
                    where: { id: In(productIds) },
                    relations: ['units'],
                })
            ).map((p) => [p.id, p])
        )
        const unitMap = new Map(
            (
                await manager
                    .getRepository(Unit)
                    .findBy({ name: In(unitNames), product: Not(IsNull()) })
            ).map((u) => [u.name, u])
        )
        const orderProductMap = new Map(
            (
                await manager.getRepository(OrderProduct).find({
                    where: { id: In(orderProductIds) },
                    relations: ['product', 'unit'],
                })
            ).map((op) => [op.id, op])
        )

        const orderProducts: OrderProduct[] = []

        for (const orderProductDto of products) {
            const product = productMap.get(orderProductDto.productId)
            if (!product)
                throw new NotFoundException(
                    ORDER_ERRORS.PRODUCT_NOT_FOUND_ERROR(
                        orderProductDto.productId
                    )
                )

            let unit: Unit = null
            if (
                orderProductDto.unitName &&
                orderProductDto.unitName.trim() !== product.baseUnit
            ) {
                unit = unitMap.get(orderProductDto.unitName)
                if (!unit)
                    throw new NotFoundException(
                        ORDER_ERRORS.UNIT_NOT_FOUND_ERROR(
                            orderProductDto.unitName
                        )
                    )
                if (!product.units.some((u) => u.id === unit.id))
                    throw new NotFoundException(
                        ORDER_ERRORS.PRODUCT_UNIT_NOT_FOUND_ERROR(
                            orderProductDto.productId,
                            orderProductDto.unitName
                        )
                    )
            }

            if ('id' in orderProductDto) {
                const orderProduct = orderProductMap.get(orderProductDto.id)
                if (!orderProduct)
                    throw new NotFoundException(
                        ORDER_ERRORS.ORDER_PRODUCT_NOT_FOUND_ERROR(
                            orderProductDto.id
                        )
                    )

                orderProduct.unit = unitMap.get(orderProductDto.unitName)
                orderProduct.quantity =
                    orderProductDto.quantity ?? orderProduct.quantity
                orderProduct.price =
                    orderProductDto.price !== undefined
                        ? orderProductDto.price
                        : orderProduct.unit
                          ? orderProduct.unit.price
                          : orderProduct.product.price
                orderProduct.total = orderProduct.quantity * orderProduct.price
                orderProducts.push(orderProduct)
            } else {
                const orderProduct = new OrderProduct()
                orderProduct.product = product
                orderProduct.unit = unit
                orderProduct.order = order
                orderProduct.quantity = orderProductDto.quantity
                orderProduct.price =
                    useCustomPrice && orderProductDto.price !== undefined
                        ? orderProductDto.price
                        : unit
                          ? unit.price
                          : product.price
                orderProduct.total = orderProduct.quantity * orderProduct.price
                orderProducts.push(orderProduct)
            }
        }

        await orderProductRepo.save(orderProducts)
        order.products = orderProducts
        order.total = orderProducts.reduce((sum, op) => sum + op.total, 0)

        return (await orderRepo.save(order)).toDto()
    }

    async createPOSOrder(
        data: CreatePOSOrderDto,
        staffId: string
    ): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(Order)
            const user = await manager
                .getRepository(User)
                .findOneBy({ id: staffId })
            if (!user)
                throw new UnauthorizedException(
                    ORDER_ERRORS.USER_NOT_FOUND_ERROR
                )

            const order = new Order()
            order.staff = user
            order.status = OrderStatus.DONE
            await orderRepo.save(order)

            return this.processOrder(manager, order, data.products, {
                useCustomPrice: true,
            })
        })
    }

    async createOnlineOrder(
        data: CreateOnlineOrderDto,
        userId: string
    ): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(Order)

            // Require a logged-in user
            if (!userId) {
                throw new UnauthorizedException(
                    ORDER_ERRORS.USER_NOT_FOUND_ERROR
                )
            }

            const user = await manager
                .getRepository(User)
                .findOneBy({ id: userId })
            if (!user) {
                throw new UnauthorizedException(
                    ORDER_ERRORS.USER_NOT_FOUND_ERROR
                )
            }

            const order = new Order()
            if (user.role === Role.CUSTOMER) {
                order.customer = user
            } else {
                // staff or other roles creating online order are set as staff
                order.staff = user
            }

            order.address = data.address
            order.phone = data.phone
            order.email = data.email
            order.customerName = data.customerName ?? user?.name
            order.status = OrderStatus.PENDING
            await orderRepo.save(order)

            return this.processOrder(manager, order, data.products)
        })
    }

    async updateOrder(
        id: string,
        data: UpdateOrderDto,
        userId: string
    ): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(Order)

            const order = await this.findOne(id)

            const user = await manager
                .getRepository(User)
                .findOne({ where: { id: userId }, select: ['id', 'role'] })
            if (!user)
                throw new UnauthorizedException(
                    ORDER_ERRORS.USER_NOT_FOUND_ERROR
                )
            if (user.role === Role.CUSTOMER && order.customer?.id !== userId)
                throw new UnauthorizedException(
                    ORDER_ERRORS.USER_NOT_OWNER_ERROR
                )
            if (order.status !== OrderStatus.PENDING)
                throw new UnprocessableEntityException(
                    ORDER_ERRORS.ORDER_NOT_PENDING_ERROR
                )

            if (user.role !== Role.CUSTOMER && data.status) {
                order.status = data.status
                order.staff = user
            }
            if (data.address) order.address = data.address
            if (data.phone) order.phone = data.phone
            if (data.email) order.email = data.email
            if (data.customerName) order.customerName = data.customerName

            if (data.products) {
                return this.processOrder(manager, order, data.products)
            }
            return (await orderRepo.save(order)).toDto()
        })
    }

    async closeOrder(id: string, userId: string): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(Order)
            const order = await orderRepo.findOne({
                where: { id },
                relations: ['customer', 'products', 'products.product'],
            })
            if (!order)
                throw new NotFoundException(ORDER_ERRORS.ORDER_NOT_FOUND_ERROR)

            const user = await manager
                .getRepository(User)
                .findOne({ where: { id: userId }, select: ['id', 'role'] })
            if (!user)
                throw new UnauthorizedException(
                    `User with ID ${userId} not found`
                )
            if (order.status === OrderStatus.DONE)
                throw new UnprocessableEntityException(
                    ORDER_ERRORS.ORDER_ALREADY_DONE_ERROR
                )

            order.status = OrderStatus.DONE
            order.staff = user
            return (await orderRepo.save(order)).toDto()
        })
    }

    async deleteOrder(id: string): Promise<void> {
        //const order = await this.findOne(id)
        await this.ordersRepository.softDelete(id)
        return
    }

    async get(offset: number = 0, limit: number = 10): Promise<OrderDto[]> {
        const findOptions: FindOptionsWhere<Order> = {}
        return (
            await this.ordersRepository.find({
                where: findOptions,
                relations: ['products', 'products.product'],
                order: { createdAt: 'DESC' },
                skip: offset,
                take: limit,
            })
        ).map((order) => order.toDto())
    }
}
