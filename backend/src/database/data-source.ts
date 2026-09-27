import 'reflect-metadata';

import { config as loadEnvironment } from 'dotenv';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { Person } from '../persons/entities/person.entity';
import { Tree } from '../trees/entities/tree.entity';
import {
  createDatabaseOptions,
  readDatabaseEnvironment,
} from './database-options';

loadEnvironment();

const dataSource = new DataSource({
  ...createDatabaseOptions(readDatabaseEnvironment()),
  entities: [Tree, Person],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
});

export default dataSource;
