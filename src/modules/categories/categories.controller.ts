import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { CategoriesService } from './categories.service'
import { Public } from '../auth/auth.guard'

@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Public()
    @Get()
    @ApiOkResponse({ description: 'Get all categories', type: [String] })
    async get() {
        return this.categoriesService.get()
    }
}
