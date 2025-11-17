import { promises as fs } from 'fs'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Category } from './category.entity'
import { Repository } from 'typeorm'
import { CategoryDto } from './category.dto'
import { Product } from '../products/product.entity'

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name)
    private readonly picturesDirectory = './pictures'

    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>
    ) {}

    async get(): Promise<CategoryDto[]> {
        const categories = await this.categoriesRepository.find({
            select: ['id', 'name'],
        })

        if (!categories || categories.length === 0) return []

        const categoryIds = categories.map((c) => c.id)

        // --- Get top product per category using window function
        let topRows: Array<{
            categoryId: string
            productId: string
            rn: string | number
        }>

        try {
            topRows = await this.productRepository
                .createQueryBuilder('product')
                .select('product.id', 'productId')
                .addSelect('category.id', 'categoryId')
                .addSelect(
                    `ROW_NUMBER() OVER (PARTITION BY category.id ORDER BY product.quantity DESC, product.id ASC)`,
                    'rn'
                )
                .innerJoin('product.categories', 'category')
                .where('product.deletedAt IS NULL')
                .andWhere('category.id IN (:...categoryIds)', { categoryIds })
                .getRawMany()
        } catch (err) {
            this.logger.error(
                'Window-function query failed — ensure DB supports window functions. Error: ' +
                    err
            )
            throw err
        }

        const topProductByCategory = new Map<string, string>()
        for (const row of topRows) {
            const rn = typeof row.rn === 'string' ? row.rn : String(row.rn)
            if (rn === '1')
                topProductByCategory.set(row.categoryId, row.productId)
        }

        // --- Count number of products per category
        const productCountsRaw = await this.productRepository
            .createQueryBuilder('product')
            .select('category.id', 'categoryId')
            .addSelect('COUNT(product.id)', 'count')
            .innerJoin('product.categories', 'category')
            .where('product.deletedAt IS NULL')
            .andWhere('category.id IN (:...categoryIds)', { categoryIds })
            .groupBy('category.id')
            .getRawMany()

        const productCounts = new Map<string, number>()
        for (const row of productCountsRaw) {
            productCounts.set(row.categoryId, Number(row.count))
        }

        // --- Resolve top product picture
        const files = await fs.readdir(this.picturesDirectory)

        const dtos: CategoryDto[] = await Promise.all(
            categories.map(async (c) => {
                let picture = ''
                const productId = topProductByCategory.get(c.id)
                if (productId) {
                    try {
                        const pictures = files.filter((file) =>
                            file.startsWith(`${productId}-`)
                        )
                        if (pictures && pictures.length > 0)
                            picture = pictures[0]
                    } catch (err) {
                        this.logger.error(
                            `Failed to read pictures for product ${productId} (category ${c.name}): ${err}`
                        )
                        picture = ''
                    }
                }

                const productCount = productCounts.get(c.id) ?? 0

                return {
                    id: c.id,
                    name: c.name,
                    picture,
                    productCount,
                } as CategoryDto
            })
        )

        return dtos
    }

    async createFromArray(data: string[] | undefined) {
        if (!data) return []
        const categories = []
        for (const category of data) {
            try {
                let c = await this.categoriesRepository.findOneBy({
                    name: category,
                })
                if (!c) {
                    c = await this.categoriesRepository.save({ name: category })
                }
                categories.push(c)
            } catch (error) {
                this.logger.error(error)
            }
        }
        return categories
    }

    async deleteUnused() {
        const unused = await this.categoriesRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.products', 'product')
            .where('product.id IS NULL')
            .getMany()

        if (unused.length > 0) {
            await this.categoriesRepository.remove(unused)
        }
    }
}
