import { applyDecorators } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

export const BatchProcessor = <T = string>(event: T) => {
  return applyDecorators(EventPattern(event));
};
