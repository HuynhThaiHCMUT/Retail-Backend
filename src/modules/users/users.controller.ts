import * as bcrypt from 'bcrypt';
import { diskStorage } from 'multer';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Request, UnauthorizedException, UnprocessableEntityException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiOkResponse, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FileUploadDto, CreateUserDto, UserDto, UpdateUserDto } from './user.dto';
import { UsersService } from './users.service';
import { Admin, AdminOrSelf } from '../auth/auth.guard';
import { Role, User } from './user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor( 
        private readonly usersService: UsersService,
    ) {}

    @Admin()
    @Get()
    @ApiQuery({ name: 'page', type: Number, required: false })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiOkResponse({ description: 'Get users info successfully', type: [UserDto] })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getUsers(
        @Query('page', new ParseIntPipe({optional: true})) page: number = 1,
        @Query('limit', new ParseIntPipe({optional: true})) limit: number = 10,
    ) {
        return false;
    }

    @AdminOrSelf()
    @Get(':id')
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Get user info successfully', type: UserDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async getUser(
        @Param('id') id: string,
    ) {
        const user = await this.usersService.findOne({ id });
        if (!user) throw new NotFoundException();
        // Remove sensitive fields before returning the user
        return { ...user, password: undefined};
    }

    @AdminOrSelf()
    @Post()
    @ApiOkResponse({ description: 'Create user successfully'})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @ApiBadRequestResponse({ description: 'Bad request'})
    async createUser(@Body() body: CreateUserDto) {
        let existed: User;
        existed = await this.usersService.findOne({phone: body.phone});
        if (existed) {
            throw new UnprocessableEntityException('Phone number already exists');
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);
        body.password = hashedPassword;
        if (!body.role) body.role = Role.EMPLOYEE;
        return this.usersService.create(body);
    }

    @AdminOrSelf()
    @Put(':id')
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Update user infomation successfully'})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @ApiBadRequestResponse({ description: 'Bad request'})
    updateUser(@Param('id') id: string, @Request() req, @Body() body: UpdateUserDto) {
        if (req.user?.id !== id) throw new UnauthorizedException();
        return this.usersService.update(req.user.id, body);
    }

    @AdminOrSelf()
    @Delete(':id')
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Delete user successfully'})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    deleteUser(@Param('id') id: string, @Request() req) {
        if (req.user?.id !== id) throw new UnauthorizedException();
        return this.usersService.delete(req.user.id);
    }

    @AdminOrSelf()
    @Post(':id/picture')
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ description: 'Upload picture', type: FileUploadDto})
    @ApiOkResponse({ description: 'Upload picture successfully', type: String})
    @ApiUnauthorizedResponse({ description: 'Unauthorized'})
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './pictures',
                filename: (req, file, callback) => {
                    const id = req.params.id;
                    const filename = `${id}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;
                    callback(null, filename);
                },
            }),
        }),
    )
    uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new NotFoundException('File not found');
        }
        return this.usersService.uploadAvatar(id, file.filename);
    }
}
