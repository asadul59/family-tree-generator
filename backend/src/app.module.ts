import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  createDatabaseOptions,
  readDatabaseEnvironment,
} from './database/database-options';
import { PersonsModule } from './persons/persons.module';
import { TreesModule } from './trees/trees.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...createDatabaseOptions(
          readDatabaseEnvironment({
            DATABASE_HOST: configService.get<string>('DATABASE_HOST'),
            DATABASE_PORT: configService.get<string>('DATABASE_PORT'),
            DATABASE_USERNAME: configService.get<string>('DATABASE_USERNAME'),
            DATABASE_PASSWORD: configService.get<string>('DATABASE_PASSWORD'),
            DATABASE_NAME: configService.get<string>('DATABASE_NAME'),
          }),
        ),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
        migrationsRun: false,
      }),
    }),
    TreesModule,
    PersonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
