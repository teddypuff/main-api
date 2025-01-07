import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import * as entityList from '~/data-source/entities';
const entities = Object.values(entityList);

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class TestAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}

export const getTestDbConnection = async () => {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  db.public.registerFunction({
    name: 'current_database',
    args: [],
    returns: DataType.text,
    implementation: (x) => 'test',
  });

  db.public.interceptQueries((queryText) => {
    if (queryText.search(/(pg_views|pg_matviews|pg_tables|pg_enum)/g) > -1) {
      return [];
    }
    return null;
  });

  db.public.registerFunction({
    name: 'version',
    args: [],
    returns: DataType.text,
    implementation: (x) => `1.0`,
  });

  db.public.registerFunction({
    name: 'obj_description',
    args: [DataType.text, DataType.text],
    returns: DataType.text,
    implementation: () => 'test',
  });

  db.public.registerFunction({
    name: 'uuid_generate_v4',
    args: [],
    returns: DataType.uuid,
    implementation: () => v4(),
  });

  db.public.registerFunction({
    name: 'date',
    args: [DataType.timestamp],
    returns: DataType.text,
    implementation: () => new Date(),
  });

  const ds: DataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    // entities: [__dirname + '../**/*.entity{.ts,.js}'],
    entities,
  });
  await ds.initialize();
  await ds.synchronize();

  // return db;
};
