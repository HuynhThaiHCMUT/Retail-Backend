import { promises as fs } from 'fs';
import * as path from 'path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, FindOptionsWhere, LessThanOrEqual, Like, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { CreateProductDto, ProductDto, UpdateProductDto } from './product.dto';
import { Product } from './product.entity';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    private readonly picturesDirectory = './pictures';

    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
        private categoriesService: CategoriesService,
    ) {}

    async findOne(findOptions: FindOptionsWhere<Product>): Promise<ProductDto> {
        let product = await this.productsRepository.findOne({
            where: {...findOptions, deleted: false},
            relations: ['categories'],
        });
        if (product) {
            product.pictures = await this.getPicturesById(product.id);
        }
        return {...product, categories: product.categories?.map((category) => category.name)};
    }

    async create(product: CreateProductDto): Promise<ProductDto> {
        let categories = await this.categoriesService.createFromArray(product.categories);
        let createdProduct = this.productsRepository.create({...product, categories});
        createdProduct = await this.productsRepository.save(createdProduct);
        return {...createdProduct, categories: product.categories};
    }

    async update(id: string, data: UpdateProductDto): Promise<void> {
        let categories = await this.categoriesService.createFromArray(data.categories);
        let product = await this.productsRepository.findOne({
            where: {id, deleted: false},
            relations: ['categories'],
        });
        if (!product) throw new NotFoundException();
        Object.assign(product, data);
        product.categories = categories;
        await this.productsRepository.save(product);
        this.categoriesService.deleteUnused();
        return;
    }

    async delete(id: string): Promise<void> {
        let product = await this.productsRepository.findOne({
            where: {id, deleted: false},
            relations: ['categories'],
        });
        if (!product) throw new NotFoundException();
        product.deleted = true;
        product.categories = [];
        await this.productsRepository.save(product);
        this.categoriesService.deleteUnused();
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
            relations: ['categories'],
        });
        let productsDto = [];
        for (let product of products) {
            product.pictures = await this.getPicturesById(product.id);
            let categories = product.categories.map((category) => category.name);
            productsDto.push({...product, categories});
        }
        return productsDto;
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
