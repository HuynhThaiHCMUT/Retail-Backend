import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderProduct } from './order-product.entity';
import { CreateOnlineOrderDto, CreatePOSOrderDto, OrderDto, UpdateOrderDto } from './order.dto';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderProductDto } from './order-product.dto';
import { OrderStatus, Role } from 'src/utils/enum';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);
    private dataSource = this.ordersRepository.manager.connection;
    constructor(
        @InjectRepository(Order)
        private readonly ordersRepository: Repository<Order>,
        @InjectRepository(OrderProduct)
        private readonly orderProductsRepository: Repository<OrderProduct>,
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async findOne(findOptions: FindOptionsWhere<Order>): Promise<OrderDto> {
        return (await this.ordersRepository.findOne({
            where: findOptions,
            relations: ['products', 'products.product'],
        }))?.toDto();
    }

    async createOrder(order: Order, products: CreateOrderProductDto[], { useCustomPrice = false }: { useCustomPrice?: boolean } = {}): Promise<OrderDto> {
        if (!products.length) throw new BadRequestException("Cannot create an order without products");
    
        return await this.dataSource.transaction(async (manager) => {
            let orderProductRepo = manager.getRepository(OrderProduct);
            let orderRepo = manager.getRepository(Order);
    
            // Fetch all products in a single query
            const productIds = products.map(p => p.productId);
            const productMap = new Map(
                (await manager.getRepository(Product).findBy({ id: In(productIds) }))
                .map(p => [p.id, p])
            );
    
            let orderProducts: OrderProduct[] = [];
            let total = 0;
    
            for (let orderProductDto of products) {
                let product = productMap.get(orderProductDto.productId);
                if (!product) throw new NotFoundException(`Product with ID ${orderProductDto.productId} not found`);
    
                let orderProduct = new OrderProduct();
                orderProduct.product = product;
                orderProduct.order = order;
                orderProduct.quantity = orderProductDto.quantity;
                orderProduct.price = (useCustomPrice && orderProductDto.price) ? orderProductDto.price : product.price;
                orderProduct.total = orderProduct.quantity * orderProduct.price;
                orderProducts.push(orderProduct);
                total += orderProduct.total;
            }
    
            await orderProductRepo.save(orderProducts);
            order.products = orderProducts;
            order.total = total;
    
            return (await orderRepo.save(order)).toDto();
        });
    }
    
    async createPOSOrder(data: CreatePOSOrderDto, staffId: string): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            let orderRepo = manager.getRepository(Order);
            let user = await manager.getRepository(User).findOneBy({ id: staffId });
            if (!user) throw new UnauthorizedException(`User with ID ${staffId} not found`);
    
            let order = new Order();
            order.staff = user;
            order.status = OrderStatus.DONE;
            await orderRepo.save(order);
    
            return this.createOrder(order, data.products, { useCustomPrice: true });
        });
    }
    
    async createOnlineOrder(data: CreateOnlineOrderDto, userId: string): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            let orderRepo = manager.getRepository(Order);
            let user = userId ? await manager.getRepository(User).findOneBy({ id: userId }) : null;
            if (userId && !user) throw new UnauthorizedException(`User with ID ${userId} not found`);
            let order = new Order();
            if (!userId) {
                if (!data.address || !data.phone || !data.customerName) throw new BadRequestException("Missing required fields");
            } else {
                if (user?.role === Role.CUSTOMER) {order.customer = user;}
                else if (user) order.staff = user;
            }
            order.address = data.address;
            order.phone = data.phone;
            order.email = data.email;
            order.customerName = data.customerName ?? user?.name;
            order.status = OrderStatus.PENDING;
            await orderRepo.save(order);
    
            return this.createOrder(order, data.products);
        });
    }

    async updateOrder(id: string, data: UpdateOrderDto, userId: string): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            let orderRepo = manager.getRepository(Order);
            let orderProductRepo = manager.getRepository(OrderProduct);
    
            let order = await orderRepo.findOne({ where: { id }, relations: ['customer', 'products', 'products.product'] });
            if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    
            let user = await manager.getRepository(User).findOne({ where: { id: userId }, select: ['id', 'role'] });
            if (!user) throw new UnauthorizedException(`User with ID ${userId} not found`);
            if (user.role === Role.CUSTOMER && order.customer?.id !== userId) throw new UnauthorizedException(`User with ID ${userId} is not the owner of the order`);
            if (order.status !== OrderStatus.PENDING) throw new UnprocessableEntityException(`Order with ID ${id} is not pending`);
    
            if (user.role !== Role.CUSTOMER && data.status) {
                order.status = data.status;
                order.staff = user;
            }
            if (data.address) order.address = data.address;
            if (data.phone) order.phone = data.phone;
            if (data.email) order.email = data.email;
            if (data.customerName) order.customerName = data.customerName

            if (order.status !== OrderStatus.PENDING) throw new UnprocessableEntityException(`Order with ID ${id} is not pending`);
    
            let orderProducts: OrderProduct[] = [];
            for (let orderProductDto of data.products || []) {
                if ('id' in orderProductDto) {
                    let orderProduct = await orderProductRepo.findOne({ where: { id: orderProductDto.id }, relations: ['product'] });
                    if (!orderProduct) throw new NotFoundException(`OrderProduct with ID ${orderProductDto.id} not found`);
                    orderProduct.quantity = orderProductDto.quantity ?? orderProduct.quantity;
                    orderProduct.price = orderProductDto.price ?? orderProduct.product.price;
                    orderProduct.total = orderProduct.quantity * orderProduct.price;
                    orderProducts.push(orderProduct);
                } else {
                    let product = await manager.getRepository(Product).findOneBy({ id: orderProductDto.productId });
                    if (!product) throw new NotFoundException(`Product with ID ${orderProductDto.productId} not found`);
                    let orderProduct = new OrderProduct();
                    orderProduct.product = product;
                    orderProduct.order = order;
                    orderProduct.quantity = orderProductDto.quantity;
                    orderProduct.price = orderProductDto.price ?? product.price;
                    orderProduct.total = orderProduct.quantity * orderProduct.price;
                    orderProducts.push(orderProduct);
                }
            }
    
            await orderProductRepo.save(orderProducts);
            order.products = await orderProductRepo.find({ where: { order: { id } } });
            order.total = order.products.reduce((sum, p) => sum + p.total, 0);
    
            return (await orderRepo.save(order)).toDto();
        });
    }

    async closeOrder(id: string, userId: string): Promise<OrderDto> {
        return await this.dataSource.transaction(async (manager) => {
            let orderRepo = manager.getRepository(Order);
            let order = await orderRepo.findOne({ where: { id }, relations: ['customer', 'products', 'products.product'] });
            if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    
            let user = await manager.getRepository(User).findOne({ where: { id: userId }, select: ['id', 'role'] });
            if (!user) throw new UnauthorizedException(`User with ID ${userId} not found`);
            if (order.status === OrderStatus.DONE) throw new UnprocessableEntityException(`Order with ID ${id} is already done`);
    
            order.status = OrderStatus.DONE;
            order.staff = user;
            return (await orderRepo.save(order)).toDto();
        });
    }

    async deleteOrder(id: string): Promise<void> {
        let deleteResult = await this.ordersRepository.softDelete(id);
        if (!deleteResult.affected) throw new NotFoundException(`Order with ID ${id} not found`);
        return;
    }

    async get(
        offset: number = 0,
        limit: number = 10,
    ): Promise<OrderDto[]> {
        let findOptions: FindOptionsWhere<Order> = {};
        return (await this.ordersRepository.find({
            where: findOptions,
            relations: ['products', 'products.product'],
            order: {createdAt: 'DESC'},
            skip: offset,
            take: limit,
        })).map(order => order.toDto());
    }
}
