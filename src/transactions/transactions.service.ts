import { Inject, Injectable } from '@nestjs/common';
import { TransactionEntity } from '../data-source/entities/transaction.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SalesStatus } from '~/common/models/enums/sales-status.enum';
import { TransactionModel } from '~/models';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionsRepository: Repository<TransactionEntity>,
  ) {}

  async createTransactions(transacrions: TransactionModel[]): Promise<{
    success: boolean;
    data?: TransactionModel[];
    message?: string;
  }> {
    try {
      await this.transactionsRepository.save(transacrions);
      return {
        success: true,
        data: transacrions,
      };
    } catch (error) {
      console.log(error.message);
      return {
        success: false,
        message: 'Error!',
      };
    }
  }

  async createTransactionsInsert(transactions: TransactionModel[]): Promise<{
    success: boolean;
    data?: TransactionModel[];
    message?: string;
  }> {
    try {
      await this.transactionsRepository.insert(transactions);
      return {
        success: true,
        data: transactions,
      };
    } catch (error) {
      console.log(`--- createTransactionsInsert Start ---`);
      console.log(error.message);
      console.log(transactions);
      console.log(`--- createTransactionsInsert END ---`);

      return {
        success: false,
        message: 'Error!',
      };
    }
  }

  async completeTransactions(transactions: TransactionModel[]) {
    try {
      if (transactions.length > 0) {
        transactions.forEach(async (transaction) => {
          transaction.salesStatus = SalesStatus.Completed;
        });
        await this.transactionsRepository.save(transactions);
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  async getPendingTransactions(): Promise<TransactionEntity[]> {
    return await this.transactionsRepository.findBy({
      salesStatus: SalesStatus.Pending,
    });
  }

  async getTransactionsByHash(txHash: string): Promise<TransactionEntity[]> {
    return this.transactionsRepository.findBy({
      payHash: txHash,
    });
  }
}
