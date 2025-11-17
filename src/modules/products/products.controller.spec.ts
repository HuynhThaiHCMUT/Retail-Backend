import { Test, TestingModule } from '@nestjs/testing'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { NotFoundException } from '@nestjs/common'
import { FILE_ERRORS } from 'src/error/file.error'

const mockProductsService = {
    get: jest.fn(),
    findOneDto: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getPicturesById: jest.fn(),
    deletePicture: jest.fn(),
}

describe('ProductsController', () => {
    let controller: ProductsController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                { provide: ProductsService, useValue: mockProductsService },
            ],
        }).compile()

        controller = module.get<ProductsController>(ProductsController)
    })

    describe('getProducts', () => {
        it('should return product list', async () => {
            mockProductsService.get.mockResolvedValue({
                items: [{ id: '1' }],
                totalCount: 1,
            })
            const result = await controller.getProducts({})
            expect(result).toEqual({
                items: [{ id: '1' }],
                totalCount: 1,
            })
        })
    })

    describe('getProduct', () => {
        it('should return product dto', async () => {
            const dto = { id: '123' }
            mockProductsService.findOneDto.mockResolvedValue(dto)
            const result = await controller.getProduct('123')
            expect(result).toEqual(dto)
        })

        it('should throw NotFoundException', async () => {
            mockProductsService.findOneDto.mockRejectedValue(
                new NotFoundException()
            )
            await expect(controller.getProduct('none')).rejects.toThrow(
                NotFoundException
            )
        })
    })

    describe('createProduct', () => {
        it('should create product', async () => {
            const body = { name: 'A', price: 100 }
            mockProductsService.create.mockResolvedValue({ id: '123' })
            const result = await controller.createProduct(body)
            expect(result).toEqual({ id: '123' })
        })
    })

    describe('updateProduct', () => {
        it('should update product', async () => {
            const body = { name: 'Updated' }
            mockProductsService.update.mockResolvedValue({ id: '123' })
            const result = await controller.updateProduct('123', body)
            expect(result).toEqual({ id: '123' })
        })
    })

    describe('deleteProduct', () => {
        it('should delete product', async () => {
            mockProductsService.delete.mockResolvedValue(undefined)
            const result = await controller.deleteProduct('123')
            expect(result).toBeUndefined()
        })
    })

    describe('uploadPicture', () => {
        it('should throw NotFoundException when no files', async () => {
            await expect(controller.uploadPicture('123', null)).rejects.toThrow(
                new NotFoundException(FILE_ERRORS.FILE_NOT_FOUND_ERROR)
            )
        })

        it('should return pictures list when files provided', async () => {
            const mockFile: Express.Multer.File = {
                fieldname: 'files',
                originalname: 'image.png',
                encoding: '7bit',
                mimetype: 'image/png',
                size: 1234,
                destination: './pictures',
                filename: '123-file.png',
                path: './pictures/123-file.png',
                buffer: Buffer.from('test'),
                stream: undefined as any,
            }

            mockProductsService.getPicturesById.mockResolvedValue([
                '123-img1.png',
            ])
            const result = await controller.uploadPicture('123', [mockFile])
            expect(result).toEqual(['123-img1.png'])
        })
    })

    describe('deletePicture', () => {
        it('should delete picture', async () => {
            mockProductsService.deletePicture.mockResolvedValue(undefined)
            const result = await controller.deletePicture('123', 'img.png')
            expect(result).toBeUndefined()
        })
    })
})
