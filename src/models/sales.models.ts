import { Transform } from 'class-transformer';
import { ProductStatus } from '~/common/models/enums/product-status.enum';
import { Products } from '~/common/models/enums/products.enum';
import { SalesTypes } from '~/common/models/enums/sales-type.enum';

export class SalesModel {
  projectName: string;
  saleType: SalesTypes;
  stageNumber: number;
  tokenPrice: number;
  @Transform(({ value }) => {
    return Math.floor(value);
  })
  issuedTokenAmount: number;
  usdWorth: number;
  product?: Products;
  productId?: string;
  productStatus?: ProductStatus;
  userWalletAddress: string;
  bonusCode?: string;
  refCode?: string;
  refUrl?: string;
  country?: string;
  ip?: string;
  transactionId: number;
  parentSalesId?: number;
  saleDetails?: string;
}
