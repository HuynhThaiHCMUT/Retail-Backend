import { join } from 'path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { ProductsModule } from './modules/products/products.module'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { CategoriesModule } from './modules/categories/categories.module'
import { OrdersModule } from './modules/orders/orders.module'
import { AuditSubscriber } from './modules/audit-logs/audit.subscriber'
import { RequestContext } from './utils/request-context'
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module'
import { ReportsModule } from './modules/reports/reports.module'

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USER'),
                password: configService.get<string>('DB_PASS'),
                database: configService.get<string>('DB_NAME'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
                autoLoadEntities: true,
                charset: 'utf8mb4',
                collation: 'utf8mb4_0900_ai_ci',
                timezone: 'Z',
            }),
            inject: [ConfigService],
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'pictures'),
            serveRoot: '/pictures/',
        }),
        ConfigModule.forRoot(),
        ScheduleModule.forRoot(),
        AuthModule,
        UsersModule,
        ProductsModule,
        CategoriesModule,
        OrdersModule,
        AuditLogsModule,
        ReportsModule,
    ],
    controllers: [AppController],
    providers: [AppService, RequestContext, AuditSubscriber],
})
export class AppModule {}
