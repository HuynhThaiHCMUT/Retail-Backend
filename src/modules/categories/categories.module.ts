import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Category } from './category.entity'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'
import { Product } from '../products/product.entity'

@Module({
    imports: [TypeOrmModule.forFeature([Category, Product])],
    providers: [CategoriesService],
    exports: [CategoriesService],
    controllers: [CategoriesController],
})
export class CategoriesModule {}
