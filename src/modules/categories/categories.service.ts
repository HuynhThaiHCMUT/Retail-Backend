import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./category.entity";
import { FindOptionsWhere, Repository } from "typeorm";
import { CategoryDto } from "./category.dto";

@Injectable()
export class CategoriesService {
    private readonly logger = new Logger(CategoriesService.name);
    
    constructor(
        @InjectRepository(Category)
        private categoriesRepository: Repository<Category>,
    ) {}

    async get() {
        return this.categoriesRepository.find();
    }

    async findOne(findOptions: FindOptionsWhere<Category>) {
        return this.categoriesRepository.findOneBy(findOptions);
    }

    async create(data: CategoryDto) {
        return this.categoriesRepository.save(data);
    }

    async createFromArray(data: string[] | undefined) {
        if (data) {
            let categories = [];
            for (let category of data) {
                try {
                    let c = await this.findOne({name: category});
                    if (!c) {
                        c = await this.create({name: category});
                    }
                    categories.push(c);
                } catch (error) {
                    this.logger.error(error);
                }
            }
            return categories;
        }
        return [];
    }

    async update(id: string, data: CategoryDto) {
        return this.categoriesRepository.update(id, data);
    }

    async delete(id: string) {
        return this.categoriesRepository.delete(id);
    }

    async deleteUnused() {
        const unused = await this.categoriesRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.products', 'product')
            .where('product.id IS NULL')
            .getMany();

        if (unused.length > 0) {
            await this.categoriesRepository.remove(unused);
        }
    }

}