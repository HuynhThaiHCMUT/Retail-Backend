import { promises as fs } from 'fs'
import * as path from 'path'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    And,
    FindOptionsWhere,
    In,
    LessThanOrEqual,
    Like,
    MoreThanOrEqual,
    Repository,
} from 'typeorm'
import { CreateProductDto, ProductDto, UpdateProductDto } from './product.dto'
import { Product } from './product.entity'
import { CategoriesService } from '../categories/categories.service'
import { UnitsService } from '../units/units.service'

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name)
    private readonly picturesDirectory = './pictures'

    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
        private categoriesService: CategoriesService,
        private unitsService: UnitsService
    ) {}

    async findOne(id: string): Promise<Product> {
        let product = await this.productsRepository.findOne({
            where: { id },
            relations: ['categories', 'units'],
        })
        if (!product)
            throw new NotFoundException(`Product with ID ${id} not found`)
        return product
    }

    async findOneDto(id: string): Promise<ProductDto> {
        return (await this.findOne(id)).toDto(await this.getPicturesById(id))
    }

    async create(product: CreateProductDto): Promise<ProductDto> {
        let categories = await this.categoriesService.createFromArray(
            product.categories
        )
        let units = await this.unitsService.createFromArray(product.units)
        let createdProduct = this.productsRepository.create({
            ...product,
            categories,
            units,
        })
        createdProduct = await this.productsRepository.save(createdProduct)
        return createdProduct.toDto()
    }

    async update(id: string, data: UpdateProductDto): Promise<ProductDto> {
        let product = await this.findOne(id)
        Object.assign(product, data)
        product.categories = await this.categoriesService.createFromArray(
            data.categories
        )
        product.units = await this.unitsService.createFromArray(data.units, id)
        product = await this.productsRepository.save(product)
        await this.categoriesService.deleteUnused()
        return product.toDto()
    }

    async delete(id: string): Promise<void> {
        let product = await this.findOne(id)
        product.categories = []
        await this.unitsService.deleteByProductId(id)
        await this.productsRepository.save(product)
        await this.productsRepository.softDelete(id)
        await this.categoriesService.deleteUnused()
        return
    }

    async get(
        offset: number = 0,
        limit: number = 10,
        sortBy?: 'time' | 'price-desc' | 'price-asc',
        name?: string,
        priceFrom?: number,
        priceTo?: number,
        categories?: string
    ): Promise<ProductDto[]> {
        let order: { [key: string]: 'ASC' | 'DESC' } = {}
        switch (sortBy) {
            case 'price-asc':
                order.price = 'ASC'
                break
            case 'price-desc':
                order.price = 'DESC'
                break
            default:
                order.createdAt = 'DESC'
                break
        }
        let where: FindOptionsWhere<Product> = {}
        if (name) {
            where.name = Like(`%${name}%`)
        }
        if (priceFrom && priceTo) {
            where.price = And(
                MoreThanOrEqual(priceFrom),
                LessThanOrEqual(priceTo)
            )
        } else if (priceFrom) {
            where.price = MoreThanOrEqual(priceFrom)
        } else if (priceTo) {
            where.price = LessThanOrEqual(priceTo)
        }
        if (categories) {
            let categoriesArray = categories.split(',')
            where.categories = In(categoriesArray)
        }
        let products = await this.productsRepository.find({
            skip: offset,
            take: limit,
            order,
            where,
            relations: ['categories', 'units'],
        })
        const pictures = await Promise.all(
            products.map((p) => this.getPicturesById(p.id))
        )
        return products.map((product, index) => product.toDto(pictures[index]))
    }

    async getPicturesById(id: string): Promise<string[]> {
        const files = await fs.readdir(this.picturesDirectory)
        return files.filter((file) => file.startsWith(`${id}-`)) // Match files by the ID prefix
    }

    async deletePicture(id: string, filename: string): Promise<void> {
        const filePath = path.join(this.picturesDirectory, filename)

        try {
            await fs.access(filePath) // Check if the file exists
            await fs.unlink(filePath) // Delete the file
            return
        } catch (error) {
            throw new NotFoundException('File not found')
        }
    }
}
