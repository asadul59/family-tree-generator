import { config as loadEnvironment } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { InitialSchema1790485411661 } from '../src/database/migrations/1790485411661-InitialSchema';
import { Person } from '../src/persons/entities/person.entity';
import { Tree } from '../src/trees/entities/tree.entity';

loadEnvironment({ path: resolve(process.cwd(), '.env'), quiet: true });

const adminDatabaseName = process.env.DATABASE_NAME ?? 'family_tree';
const testDatabaseName = process.env.TEST_DATABASE_NAME ?? 'family_tree_test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_NAME = testDatabaseName;
(globalThis as typeof globalThis & { __dirname?: string }).__dirname = resolve(
  process.cwd(),
  'src',
);

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function ensureTestDatabase(): Promise<void> {
  const adminDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: adminDatabaseName,
  });

  await adminDataSource.initialize();

  try {
    // TypeORM 1.x resolves `query()` for a SELECT to the rows array itself.
    const rows = await adminDataSource.query<Array<{ exists: boolean }>>(
      'SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
      [testDatabaseName],
    );

    if (!rows[0]?.exists) {
      await adminDataSource.query(
        `CREATE DATABASE ${quoteIdentifier(testDatabaseName)}`,
      );
    }
  } finally {
    await adminDataSource.destroy();
  }
}

async function migrateTestDatabase(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: testDatabaseName,
    entities: [Tree, Person],
    migrations: [InitialSchema1790485411661],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}

await ensureTestDatabase();
await migrateTestDatabase();
