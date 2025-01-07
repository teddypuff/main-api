import { SetMetadata } from '@nestjs/common';
export const IgnoreProjectGuard = () => SetMetadata('ignoreProjectGuard', true);
