import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { CategoriesService } from './categories.service'
import { Public } from '../auth/auth.guard'
import { CategoryDto } from './category.dto'

@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Public()
    @Get()
    @ApiOkResponse({ description: 'Get all categories', type: [CategoryDto] })
    async get() {
        return this.categoriesService.get()
    }
}
