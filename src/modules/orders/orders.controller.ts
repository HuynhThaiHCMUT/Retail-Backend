import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
} from '@nestjs/common'
import { Admin, Staff } from '../auth/auth.guard'
import {
    CreateOnlineOrderDto,
    CreatePOSOrderDto,
    OrderDto,
    UpdateOrderDto,
} from './order.dto'
import { OrdersService } from './orders.service'
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger'

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
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiOkResponse({
        type: [OrderDto],
        description: 'Retrieved orders successfully',
    })
    async getOrders(
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
    ) {
        return this.ordersService.get(offset, limit)
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

    @Admin()
    @Delete(':id')
    @ApiOkResponse({ description: 'Deleted order successfully' })
    @ApiNotFoundResponse({ description: 'Order not found' })
    async deleteOrder(@Param('id') id: string) {
        return this.ordersService.deleteOrder(id)
    }
}
