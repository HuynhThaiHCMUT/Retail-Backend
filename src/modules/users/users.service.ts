import * as bcrypt from 'bcrypt'
import {
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common'
import { User } from './user.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto'
import { SignInDto } from '../auth/auth.dto'
import { AUTH_ERRORS } from 'src/error/auth.error'

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name)
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } })
        if (!user) throw new NotFoundException(AUTH_ERRORS.uSER_NOT_FOUND_ERROR)
        return user
    }

    async findOneDto(id: string): Promise<UserDto> {
        return (await this.findOne(id)).toDto()
    }

    async get(offset: number, limit: number): Promise<UserDto[]> {
        const users = await this.usersRepository.find({
            skip: offset,
            take: limit,
        })
        return users.map((user) => user.toDto())
    }

    async verify(data: SignInDto): Promise<UserDto> {
        const user = await this.usersRepository.findOneBy({ phone: data.phone })
        if (!user || !(await bcrypt.compare(data.password, user.password))) {
            throw new UnauthorizedException(
                AUTH_ERRORS.INVALID_CREDENTIALS_ERROR
            )
        }
        return user.toDto()
    }

    async create(data: CreateUserDto): Promise<UserDto> {
        const existed = await this.usersRepository.findOneBy({
            phone: data.phone,
        })
        if (existed) {
            throw new UnprocessableEntityException(
                AUTH_ERRORS.DUPPLICATE_PHONE_ERROR
            )
        }

        const hashedPassword = await bcrypt.hash(data.password, 10)
        const newUser = this.usersRepository.create({
            ...data,
            password: hashedPassword,
        })
        return (await this.usersRepository.save(newUser)).toDto()
    }

    async update(id: string, data: UpdateUserDto): Promise<UserDto> {
        const user = await this.findOne(id)

        Object.assign(user, data)
        return (await this.usersRepository.save(user)).toDto()
    }

    async delete(id: string): Promise<void> {
        const user = await this.findOne(id)
        await this.usersRepository.softRemove(user)
    }

    async uploadAvatar(id: string, picture: string): Promise<string> {
        const user = await this.findOne(id)

        user.picture = picture
        await this.usersRepository.save(user)
        return picture
    }

    async rotateToken(id: string, refreshToken: string): Promise<void> {
        const user = await this.findOne(id)
        user.refreshToken = refreshToken
        await this.usersRepository.save(user)
    }
}
