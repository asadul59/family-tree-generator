import type { DataSourceOptions } from 'typeorm';

export interface DatabaseEnvironment {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function requireEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  name: string,
): string {
  const value = environment[name];

  if (!value) {
    throw new Error(`Missing database environment variable: ${name}`);
  }

  return value;
}

export function readDatabaseEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseEnvironment {
  const port = Number(requireEnvironmentValue(environment, 'DATABASE_PORT'));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DATABASE_PORT must be a valid TCP port.');
  }

  return {
    host: requireEnvironmentValue(environment, 'DATABASE_HOST'),
    port,
    username: requireEnvironmentValue(environment, 'DATABASE_USERNAME'),
    password: requireEnvironmentValue(environment, 'DATABASE_PASSWORD'),
    database: requireEnvironmentValue(environment, 'DATABASE_NAME'),
  };
}

export function createDatabaseOptions(
  environment: DatabaseEnvironment,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: environment.host,
    port: environment.port,
    username: environment.username,
    password: environment.password,
    database: environment.database,
    synchronize: false,
    migrationsRun: false,
  };
}
