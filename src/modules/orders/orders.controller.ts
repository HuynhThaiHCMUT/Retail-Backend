import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Req,
    ValidationPipe,
} from '@nestjs/common'
import { Admin, Staff } from '../auth/auth.guard'
import {
    CreateOnlineOrderDto,
    CreatePOSOrderDto,
    GetOrdersQueryDto,
    OrderDto,
    UpdateOrderDto,
} from './order.dto'
import { OrdersService } from './orders.service'
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger'
import { PartialList } from 'src/utils/data'

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Staff()
    @Get(':id')
    @ApiOkResponse({
        type: OrderDto,
        description: 'Retrieved order successfully',
    })
    @ApiNotFoundResponse({ description: 'Order not found' })
    async getOrderById(@Param('id') id: string) {
        return this.ordersService.findOneDto(id)
    }

    @Staff()
    @Get()
    @ApiExtraModels(GetOrdersQueryDto)
    @ApiOkResponse({
        type: PartialList<OrderDto>,
        description: 'Retrieved orders successfully',
    })
    async getOrders(
        @Query(new ValidationPipe({ transform: true }))
        query: GetOrdersQueryDto
    ) {
        return this.ordersService.get(
            query.offset,
            query.limit,
            query.sortBy,
            query.totalFrom,
            query.totalTo,
            query.status
        )
    }

    @Staff()
    @Post('pos')
    @ApiOkResponse({
        type: OrderDto,
        description: 'Created POS order successfully',
    })
    @ApiNotFoundResponse({ description: 'Product not found' })
    async createOrder(@Body() data: CreatePOSOrderDto, @Req() req: Request) {
        return this.ordersService.createPOSOrder(data, req['user'].id)
    }

    @Post('online')
    @ApiOkResponse({
        type: OrderDto,
        description: 'Created online order successfully',
    })
    @ApiNotFoundResponse({ description: 'Product not found' })
    async createOnlineOrder(
        @Body() data: CreateOnlineOrderDto,
        @Req() req: Request
    ) {
        return this.ordersService.createOnlineOrder(data, req['user'].id)
    }

    @Put(':id')
    @ApiOkResponse({
        type: OrderDto,
        description: 'Updated order successfully',
    })
    @ApiNotFoundResponse({
        description: 'Order, order product or product not found',
    })
    async updateOrder(
        @Param('id') id: string,
        @Body() data: UpdateOrderDto,
        @Req() req: Request
    ) {
        return this.ordersService.updateOrder(id, data, req['user'].id)
    }

    @Put(':id/close')
    @ApiOkResponse({
        type: OrderDto,
        description: 'Close order successfully',
    })
    @ApiNotFoundResponse({
        description: 'Order, order product or product not found',
    })
    async closeOrder(@Param('id') id: string, @Req() req: Request) {
        return this.ordersService.closeOrder(id, req['user'].id)
    }

    @Admin()
    @Delete(':id')
    @ApiOkResponse({ description: 'Deleted order successfully' })
    @ApiNotFoundResponse({ description: 'Order not found' })
    async deleteOrder(@Param('id') id: string, @Req() req: Request) {
        return this.ordersService.deleteOrder(id, req['user'].id)
    }
}
