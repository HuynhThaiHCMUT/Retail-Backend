import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Body, Controller, DefaultValuePipe, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CreateProductDto, FilesUploadDto, ProductDto, UpdateProductDto } from './product.dto';
import { ProductsService } from './products.service';
import { Public } from '../auth/auth.guard';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Public()
    @Get()
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String, enum: ['time', 'price-desc', 'price-asc'] })
    @ApiQuery({ name: 'name', required: false, type: String })
    @ApiQuery({ name: 'priceFrom', required: false, type: Number })
    @ApiQuery({ name: 'priceTo', required: false, type: Number })
    @ApiOkResponse({ description: 'Get products successfully', type: [ProductDto] })
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    getProducts(
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number, 
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number, 
        @Query('sortBy') sortBy?: "time" | "price-desc" | "price-asc", 
        @Query('name') name?: string,
        @Query('priceFrom', new ParseIntPipe({optional: true})) priceFrom?: number,
        @Query('priceTo', new ParseIntPipe({optional: true})) priceTo?: number
    ) {
        return this.productsService.get(
            offset, 
            limit, 
            sortBy,
            name,
            priceFrom,
            priceTo
        );
    }

    @Public()
    @Get(':id')
    @ApiOkResponse({ description: 'Get product successfully', type: ProductDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @ApiNotFoundResponse({ description: 'Product not found'})
    async getProduct(@Param('id') id: string) {
        return await this.productsService.find(id);
    }

    @Post()
    @ApiOkResponse({ description: 'Create new product successfully', type: ProductDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    createProduct(@Body() productDto: CreateProductDto) {
        return this.productsService.create(productDto);
    }
    
    @Put(':id')
    @ApiOkResponse({ description: 'Update product information successfully', type: ProductDto})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @ApiNotFoundResponse({ description: 'Product not found'})
    updateProduct(@Param('id') id: string, @Body() productDto: UpdateProductDto) {
        return this.productsService.update(id, productDto);
    }
    
    @Delete(':id')
    @ApiOkResponse({ description: 'Delete product successfully'})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @ApiNotFoundResponse({ description: 'Product not found'})
    deleteProduct(@Param('id') id: string) {
        return this.productsService.delete(id);
    }

    @Post(':id/pictures')
    @ApiBody({ description: 'Upload pictures', type: FilesUploadDto})
    @ApiOkResponse({ description: 'Upload pictures successfully', type: [String]})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @UseInterceptors(
        FilesInterceptor('files', 20, {
            storage: diskStorage({
                destination: './pictures',
                filename: (req, file, callback) => {
                    const pictureId = uuidv4();
                    const id = req.params.id;
                    const filename = `${id}-${pictureId}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
                    callback(null, filename);
                },
            }),
        }),
    )
    async uploadPicture(@Param('id') id: string, @UploadedFiles() files: Array<Express.Multer.File>) {
        if (!files) {
            throw new NotFoundException('File not found');
        }
        return this.productsService.getPicturesById(id);
    }

    @Delete(':id/pictures/:filename')
    @ApiOkResponse({ description: 'Delete picture successfully'})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @ApiNotFoundResponse({ description: 'Picture not found'})
    async deletePicture(@Param('id') id: string, @Param('filename') filename: string) {
        return this.productsService.deletePicture(id, filename);
    }
}
