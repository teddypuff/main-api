import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getTestDbConnection } from '~/testing/test.helpers';
import { AppModule } from '~/app.module';
import { DataSource } from 'typeorm';

describe('Transactions Service', () => {
  let module: TestingModule;
  let service: TransactionsService;

  beforeAll(async () => {
    const db = await getTestDbConnection();

    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(db)
      .compile();

    service = module.get(TransactionsService);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
  });
});
