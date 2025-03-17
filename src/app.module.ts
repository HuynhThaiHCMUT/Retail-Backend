import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AuditSubscriber } from './modules/audit-logs/audit.subscriber';
import { RequestContext } from './utils/request-context';
import { AuditLogsService } from './modules/audit-logs/audit-logs.service';
import { AuditLogsController } from './modules/audit-logs/audit-logs.controller';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

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
        collation: 'utf8mb4_unicode_ci',
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
  ],
  controllers: [AppController],
  providers: [AppService, RequestContext, AuditSubscriber],
})
export class AppModule { }
