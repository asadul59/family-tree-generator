import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

export async function createTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useLogger(false);
  await app.init();

  return {
    app,
    dataSource: app.get<DataSource>(getDataSourceToken()),
  };
}

export async function resetTestDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query('TRUNCATE TABLE "persons", "trees" CASCADE');
}
