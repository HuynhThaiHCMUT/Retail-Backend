import { diskStorage } from 'multer'
import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import {
    FileUploadDto,
    CreateUserDto,
    UserDto,
    UpdateUserDto,
} from './user.dto'
import { UsersService } from './users.service'
import { Admin, AdminOrSelf } from '../auth/auth.guard'
import { Role } from 'src/utils/enum'

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Admin()
    @Get()
    @ApiQuery({ name: 'page', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiOkResponse({
        description: 'Get users info successfully',
        type: [UserDto],
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getUsers(
        @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10
    ) {
        return await this.usersService.get(page, limit)
    }

    @AdminOrSelf()
    @Get(':id')
    @ApiOkResponse({ description: 'Get user info successfully', type: UserDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getUser(@Param('id') id: string) {
        return await this.usersService.find(id)
    }

    @Admin()
    @Post()
    @ApiOkResponse({ description: 'Create user successfully', type: UserDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    async createUser(@Body() body: CreateUserDto) {
        if (!body.role) body.role = Role.EMPLOYEE
        return this.usersService.create(body)
    }

    @AdminOrSelf()
    @Put(':id')
    @ApiOkResponse({
        description: 'Update user infomation successfully',
        type: UserDto,
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
        return this.usersService.update(id, body)
    }

    @AdminOrSelf()
    @Delete(':id')
    @ApiOkResponse({ description: 'Delete user successfully' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    deleteUser(@Param('id') id: string) {
        return this.usersService.delete(id)
    }

    @AdminOrSelf()
    @Post(':id/picture')
    @ApiBody({ description: 'Upload picture', type: FileUploadDto })
    @ApiOkResponse({ description: 'Upload picture successfully', type: String })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './pictures',
                filename: (req, file, callback) => {
                    const id = req.params.id
                    const filename = `${id}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`
                    callback(null, filename)
                },
            }),
        })
    )
    uploadAvatar(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new NotFoundException('File not found')
        }
        return this.usersService.uploadAvatar(id, file.filename)
    }
}
