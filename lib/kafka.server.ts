import { KafkaOptions, ServerKafka } from '@nestjs/microservices';
import {
  Consumer,
  EachBatchHandler,
  EachBatchPayload,
  KafkaMessage,
} from '@nestjs/microservices/external/kafka.interface';
import { KafkaBatchDeserializer } from './kafka.deserializer';
import { KafkaBatchContext } from './kafka.context';

export interface BatchKafkaOptionsConfig
  extends Omit<KafkaOptions['options'], 'producer' | 'producerOnlyMode'> {
  run?: BatchConsumerRunConfig;
}

export type BatchConsumerRunConfig = {
  autoCommit?: boolean;
  autoCommitInterval?: number;
  autoCommitThreshold?: number;
  eachBatchAutoResolve?: boolean;
  partitionsConsumedConcurrently?: number;
};

export class KafkaBatchServer extends ServerKafka {
  constructor(readonly options: BatchKafkaOptionsConfig) {
    super(options);
  }

  public async bindEvents(consumer: Consumer) {
    const registeredPatterns = [...this.messageHandlers.keys()];
    const consumerSubscribeOptions = this.options.subscribe || {};

    if (registeredPatterns.length > 0) {
      await this.consumer.subscribe({
        ...consumerSubscribeOptions,
        topics: registeredPatterns,
      });
    }

    const consumerRunOptions = Object.assign(this.options.run || {}, {
      eachBatch: this.getMessageHandler(),
    });
    await consumer.run(consumerRunOptions);
  }

  // @ts-expect-error Different interface with parent class (EachMessagePayload vs EachBatchPayload)
  public getMessageHandler(): EachBatchHandler {
    return async (payload: EachBatchPayload) => this.handleMessage(payload);
  }

  // @ts-expect-error Different interface with parent class (EachMessagePayload vs EachBatchPayload)
  public async handleMessage(payload: EachBatchPayload) {
    const channel = payload.batch.topic;
    const rawMessages = [];
    for (const message of payload.batch.messages) {
      rawMessages.push(
        this.parser.parse<KafkaMessage>(
          Object.assign(message, {
            topic: channel,
            partition: payload.batch.partition,
          }),
        ),
      );
    }

    const packet = await this.deserializer.deserialize(rawMessages, {
      channel,
    });
    const kafkaContext = new KafkaBatchContext([
      rawMessages,
      this.consumer,
      payload.resolveOffset,
      payload.heartbeat,
      payload.pause,
      payload.commitOffsetsIfNecessary,
      payload.uncommittedOffsets,
      payload.isRunning,
      payload.isStale,
    ]);

    // @ts-expect-error Different interface with parent class (KafkaBatchContext vs KafkaContext)
    return this.handleEvent(packet.pattern, packet, kafkaContext);
  }

  protected initializeDeserializer(options: BatchKafkaOptionsConfig) {
    this.deserializer = options.deserializer ?? new KafkaBatchDeserializer();
  }
}
