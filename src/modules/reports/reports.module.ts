import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { OrderProduct } from '../orders/order-product.entity'
import { Order } from '../orders/order.entity'
import { Product } from '../products/product.entity'
import { Unit } from '../units/unit.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Product, Order, OrderProduct, Unit])],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule {}
