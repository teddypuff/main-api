import { Transform } from 'class-transformer';
import { IsOptional, Matches } from 'class-validator';

export class UserDetailsModel {
  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  projectName: string;

  @IsOptional()
  fullName?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  @Matches('^\\dx[a-fA-F0-9]{40,44}$')
  walletAddress?: string;

  tokenBalance?: number;

  refEarnings?: number;

  refCount?: number;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  email?: string;

  @IsOptional()
  mobile?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  refUrl?: string;

  @IsOptional()
  ipAddress?: string;

  @IsOptional()
  referralCode?: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  message?: string;
}
