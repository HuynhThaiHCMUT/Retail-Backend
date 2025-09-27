import { Controller, Get, Query } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import {
    SummaryResponseDto,
    SummaryQueryDto,
    ChartItemDto,
    ChartQueryDto,
    TopSoldItemDto,
} from './reports.dto'
import { Public } from '../auth/auth.guard'

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Public()
    @Get('summary')
    @ApiOkResponse({ type: SummaryResponseDto })
    async summary(
        @Query() query: SummaryQueryDto
    ): Promise<SummaryResponseDto> {
        return this.reportsService.getSummary(query.range, query.date)
    }

    @Public()
    @Get('top-sold')
    @ApiOkResponse({ type: TopSoldItemDto, isArray: true })
    async topSold(@Query() query: SummaryQueryDto): Promise<TopSoldItemDto[]> {
        return this.reportsService.getTopSold(query.range, query.date)
    }

    @Public()
    @Get('chart')
    @ApiOkResponse({ type: ChartItemDto, isArray: true })
    async chart(@Query() query: ChartQueryDto): Promise<ChartItemDto[]> {
        return this.reportsService.getChart(
            query.metric,
            query.range,
            query.date
        )
    }
}
