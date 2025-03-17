import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto';
import { SignInDto } from '../auth/auth.dto';


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async find(id: string): Promise<UserDto> {
        let user = await this.usersRepository.findOneBy({id});
        if (!user) throw new NotFoundException();
        return user.toDto();
    }

    async get(offset: number, limit: number): Promise<UserDto[]> {
        return (await this.usersRepository.find({skip: offset, take: limit})).map(user => user.toDto());
    }

    async verify(data: SignInDto): Promise<UserDto> {
        let user = await this.usersRepository.findOneBy({phone: data.phone});
        if (!user) throw new UnauthorizedException('Phone number or password is incorrect');
        if (!await bcrypt.compare(data.password, user.password)) throw new UnauthorizedException('Phone number or password is incorrect');
        return user.toDto();
    }

    async create(data: CreateUserDto): Promise<UserDto> {
        let existed = await this.usersRepository.findOneBy({phone: data.phone});
        if (existed) {
            throw new UnprocessableEntityException('Phone number already exists');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        data.password = hashedPassword;
        return (await this.usersRepository.save(data)).toDto();
    }

    async update(id: string, data: UpdateUserDto): Promise<void> {
        let updateResult = await this.usersRepository.update(id, data);
        if (updateResult.affected == 0) throw new NotFoundException();
        return;
    }

    async delete(id: string): Promise<void> {
        let deleteResult = await this.usersRepository.softDelete(id);
        if (deleteResult.affected == 0) throw new NotFoundException();
        return;
    }

    async uploadAvatar(id: string, picture: string): Promise<string> {
        let updateResult = await this.usersRepository.update(id, {picture});
        if (updateResult.affected == 0) throw new NotFoundException();
        return picture;
    }
}
