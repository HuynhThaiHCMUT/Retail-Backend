import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { Public } from './modules/auth/auth.guard'
import { ApiTags } from '@nestjs/swagger'

@Controller()
@ApiTags('app')
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Public()
    @Get('scheduler')
    getScheduler() {
        return { success: true }
    }
}
