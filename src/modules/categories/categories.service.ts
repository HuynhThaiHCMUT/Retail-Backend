import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Category } from './category.entity'
import { Repository } from 'typeorm'

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name)

    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>
    ) {}

    async get() {
        return (await this.categoriesRepository.find()).map((c) => c.name)
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
