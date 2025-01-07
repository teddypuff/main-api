import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { Currencies } from '~/common/models/enums/currencies.enum';
import { Networks } from '~/common/models/enums/network.enum';
import { SalesStatus } from '~/common/models/enums/sales-status.enum';

export class TransactionModel {
  project: string;
  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  fromAddress?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  toAddress?: string;

  block?: number;
  tokenAmount?: number;
  usdAmount?: number;
  currency?: Currencies;
  network?: Networks;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  payHash?: string;

  message?: string;
  salesStatus?: SalesStatus;
}
