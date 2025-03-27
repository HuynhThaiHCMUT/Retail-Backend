import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { Product } from './product.entity'
import { CategoriesModule } from '../categories/categories.module'
import { UnitsModule } from '../units/units.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Product]),
        CategoriesModule,
        UnitsModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule {}
