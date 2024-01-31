import { Controller, Inject } from '@nestjs/common';
import { Ctx, Payload } from '@nestjs/microservices';
import { KafkaMessage } from 'kafkajs';
import { BatchProcessor, KafkaBatchContext } from '../../lib';

@Controller()
export class TestController {
  constructor(@Inject('KAFKA_BATCH_CLIENT') private readonly kafkaClient) {}

  @BatchProcessor('test')
  async test(
    @Payload() data: KafkaMessage[],
    @Ctx() context: KafkaBatchContext,
  ) {
    const heartbeat = context.getHeartbeat();
    const resolveOffset = context.getResolveOffset();
    const commitOffsetsIfNecessary = context.getCommitOffsetsIfNecessary();

    await heartbeat();

    for (const message of data) {
      console.log(message);
    }

    resolveOffset(context.getMessages().at(-1).offset);
    console.log(context);

    await heartbeat();
    await commitOffsetsIfNecessary();
  }
}
