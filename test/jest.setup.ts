import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../src/**/*.entity.ts'],
  synchronize: true,
});

beforeAll(async () => {
  await dataSource.initialize();
  await dataSource.synchronize(true);
});

afterEach(async () => {
  await dataSource.destroy();
});

jest.setTimeout(30000);
