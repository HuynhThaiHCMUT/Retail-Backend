import { promises as fs } from 'fs';
import * as path from 'path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, FindOptionsWhere, LessThanOrEqual, Like, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { CreateProductDto, ProductDto, UpdateProductDto } from './product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    private readonly picturesDirectory = './pictures';

    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
    ) {}

    async findOne(findOptions: FindOptionsWhere<Product>): Promise<Product> {
        let product = await this.productsRepository.findOne({
            where: {...findOptions, deleted: false},
        });
        if (product) {
            product.pictures = await this.getPicturesById(product.id);
        }
        return product;
    }

    async create(product: CreateProductDto): Promise<Product> {
        let createdProduct = this.productsRepository.create(product);
        return await this.productsRepository.save(createdProduct);
    }

    async update(id: string, product: UpdateProductDto): Promise<void> {
        let updateResult = await this.productsRepository.update(id, product);
        if (updateResult.affected == 0) throw new NotFoundException();
        return;
    }

    async delete(id: string): Promise<void> {
        let deleteResult = await this.productsRepository.update(id, { deleted: true });
        if (deleteResult.affected == 0) throw new NotFoundException();
        return;
    }

    async get(
        offset: number = 0, 
        limit: number = 10, 
        sortBy?: 'time' | 'price-desc' | 'price-asc', 
        name?: string,
        priceFrom?: number,
        priceTo?: number
    ): Promise<ProductDto[]> {
        let order: { [key: string]: 'ASC' | 'DESC' } = {};
        switch (sortBy) {
            case 'price-asc':
                order.price = 'ASC';
                break;
            case 'price-desc':
                order.price = 'DESC';
                break;
            default:
                order.createdAt = 'DESC';
                break;
        }
        let where: FindOptionsWhere<Product> = {
            deleted: false,
        };
        if (name) {
            where.name = Like(`%${name}%`);
        }
        if (priceFrom && priceTo) {
            where.price = And(MoreThanOrEqual(priceFrom), LessThanOrEqual(priceTo));
        } else if (priceFrom) {
            where.price = MoreThanOrEqual(priceFrom);
        } else if (priceTo) {
            where.price = LessThanOrEqual(priceTo);
        }
        let products = await this.productsRepository.find({
            skip: offset,
            take: limit,
            order,
            where,
        });
        for (let product of products) {
            product.pictures = await this.getPicturesById(product.id);
        }
        return products;
    }

    async getPicturesById(id: string): Promise<string[]> {
        const files = await fs.readdir(this.picturesDirectory);
        return files.filter((file) => file.startsWith(`${id}-`)); // Match files by the ID prefix
    }

    async deletePicture(id: string, filename: string): Promise<void> {
        const filePath = path.join(this.picturesDirectory, filename);

        try {
            await fs.access(filePath); // Check if the file exists
            await fs.unlink(filePath); // Delete the file
            return;
        } catch (error) {
            throw new NotFoundException('File not found');
        }
    }
}
