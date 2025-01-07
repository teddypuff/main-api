import { ApiProperty } from '@nestjs/swagger';

export class Bonus {
  @ApiProperty({
    type: String,
    required: false,
  })
  bonusCode?: string;

  @ApiProperty({
    type: Number,
    required: false,
  })
  bonusPercentage?: number;
}

export class BonusValidationRes {
  @ApiProperty({
    type: Boolean,
    required: false,
  })
  valid?: boolean;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  active?: boolean;

  @ApiProperty({
    type: Bonus,
    required: false,
  })
  bonus?: Bonus;
}
