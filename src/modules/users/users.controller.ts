import { diskStorage } from 'multer'
import { v4 as uuidv4 } from 'uuid'
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
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiOkResponse,
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
import { FILE_ERRORS } from 'src/error/file.error'

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Admin()
    @Get()
    @ApiQuery({ name: 'offset', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiOkResponse({
        description: 'Get users info successfully',
        type: [UserDto],
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getUsers(
        @Query('offset', new ParseIntPipe({ optional: true }))
        offset: number = 0,
        @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10
    ) {
        return await this.usersService.get(offset, limit)
    }

    @AdminOrSelf()
    @Get(':id')
    @ApiOkResponse({ description: 'Get user info successfully', type: UserDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getUser(@Param('id') id: string) {
        return await this.usersService.findOneDto(id)
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

    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @UseInterceptors(
        FilesInterceptor('files', 1, {
            storage: diskStorage({
                destination: './pictures',
                filename: (req, file, callback) => {
                    const pictureId = uuidv4()
                    const id = req.params.id
                    const filename = `${id}-${pictureId}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`
                    callback(null, filename)
                },
            }),
        })
    )
    async uploadPicture(
        @Param('id') id: string,
        @UploadedFiles() files: Array<Express.Multer.File>
    ) {
        if (!files || files.length === 0) {
            throw new NotFoundException(FILE_ERRORS.FILE_NOT_FOUND_ERROR)
        }
        return this.usersService.uploadAvatar(id, files[0].filename)
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
            throw new NotFoundException(FILE_ERRORS.FILE_NOT_FOUND_ERROR)
        }
        return this.usersService.uploadAvatar(id, file.filename)
    }
}
