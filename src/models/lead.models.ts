import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateLeadReq {
  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Project name',
  })
  project?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Source',
  })
  source?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Project type',
  })
  type?: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Full name',
  })
  fullName?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Wallet address',
  })
  walletAddress?: string;

  @IsOptional()
  ip_address?: string;

  @Transform(({ value }) => {
    return value.toLowerCase();
  })
  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Email',
  })
  email?: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Mobile Phone',
  })
  mobile?: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Country',
  })
  country?: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    description: 'Message',
  })
  message?: string;
}
