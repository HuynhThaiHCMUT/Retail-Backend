import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common'
import { EntityManager, FindOptionsWhere, In, Repository } from 'typeorm'
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
    private dataSource = this.ordersRepository.manager.connection
    constructor(
        @InjectRepository(Order)
        private readonly ordersRepository: Repository<Order>
    ) {}

    async findOne(findOptions: FindOptionsWhere<Order>): Promise<OrderDto> {
        return (
            await this.ordersRepository.findOne({
                where: findOptions,
                relations: [
                    'products',
                    'products.product',
                    'products.unit',
                    'staff',
                    'customer',
                ],
            })
        )?.toDto()
    }

    async processOrder(
        manager: EntityManager,
        order: Order,
        products: (CreateOrderProductDto | UpdateOrderProductDto)[],
        { useCustomPrice = false }: { useCustomPrice?: boolean } = {}
    ): Promise<OrderDto> {
        let orderProductRepo = manager.getRepository(OrderProduct)
        let orderRepo = manager.getRepository(Order)

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
                    .findBy({ name: In(unitNames) })
            ).map((u) => [u.id, u])
        )
        const orderProductMap = new Map(
            (
                await manager.getRepository(OrderProduct).find({
                    where: { id: In(orderProductIds) },
                    relations: ['product', 'unit'],
                })
            ).map((op) => [op.id, op])
        )

        let orderProducts: OrderProduct[] = []

        for (let orderProductDto of products) {
            if ('id' in orderProductDto) {
                let orderProduct = orderProductMap.get(orderProductDto.id)
                if (!orderProduct)
                    throw new NotFoundException(
                        ORDER_ERRORS.ORDER_PRODUCT_NOT_FOUND_ERROR(
                            orderProductDto.id
                        )
                    )
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
                let product = productMap.get(orderProductDto.productId)
                if (!product)
                    throw new NotFoundException(
                        ORDER_ERRORS.PRODUCT_NOT_FOUND_ERROR(
                            orderProductDto.productId
                        )
                    )

                let unit: Unit = null
                if (orderProductDto.unitName) {
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

                let orderProduct = new OrderProduct()
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
            let orderRepo = manager.getRepository(Order)
            let user = await manager
                .getRepository(User)
                .findOneBy({ id: staffId })
            if (!user)
                throw new UnauthorizedException(
                    ORDER_ERRORS.USER_NOT_FOUND_ERROR
                )

            let order = new Order()
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
            let orderRepo = manager.getRepository(Order)
            let user = userId
                ? await manager.getRepository(User).findOneBy({ id: userId })
                : null
            if (userId && !user)
                throw new UnauthorizedException(
                    ORDER_ERRORS.USER_NOT_FOUND_ERROR
                )
            let order = new Order()
            if (!userId) {
                if (!data.address || !data.phone || !data.customerName)
                    throw new BadRequestException(
                        ORDER_ERRORS.MISSING_CUSTOMER_INFO_ERROR
                    )
            } else {
                if (user?.role === Role.CUSTOMER) {
                    order.customer = user
                } else if (user) order.staff = user
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
            let orderRepo = manager.getRepository(Order)

            let order = await orderRepo.findOne({
                where: { id },
                relations: [
                    'customer',
                    'staff',
                    'products',
                    'products.product',
                    'products.unit',
                ],
            })
            if (!order)
                throw new NotFoundException(ORDER_ERRORS.ORDER_NOT_FOUND_ERROR)

            let user = await manager
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
            let orderRepo = manager.getRepository(Order)
            let order = await orderRepo.findOne({
                where: { id },
                relations: ['customer', 'products', 'products.product'],
            })
            if (!order)
                throw new NotFoundException(ORDER_ERRORS.ORDER_NOT_FOUND_ERROR)

            let user = await manager
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
        let deleteResult = await this.ordersRepository.softDelete(id)
        if (!deleteResult.affected)
            throw new NotFoundException(ORDER_ERRORS.ORDER_NOT_FOUND_ERROR)
        return
    }

    async get(offset: number = 0, limit: number = 10): Promise<OrderDto[]> {
        let findOptions: FindOptionsWhere<Order> = {}
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
