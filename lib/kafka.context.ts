import { BaseRpcContext } from '@nestjs/microservices';
import type {
  Consumer,
  KafkaMessage,
  Offsets,
  OffsetsByTopicPartition,
} from 'kafkajs';

type KafkaBatchContextArgs = [
  messages: KafkaMessage[],
  consumer: Consumer,
  resolveOffset: (offset: string) => void,
  heartbeat: () => Promise<void>,
  pause: () => void,
  commitOffsetsIfNecessary: (offsets?: Offsets) => Promise<void>,
  uncommittedOffsets: () => OffsetsByTopicPartition,
  isRunning: () => boolean,
  isStale: () => boolean,
];

export class KafkaBatchContext extends BaseRpcContext<KafkaBatchContextArgs> {
  constructor(args: KafkaBatchContextArgs) {
    super(args);
  }

  getMessages(): KafkaMessage[] {
    return this.getArgByIndex(0);
  }

  getConsumer(): Consumer {
    return this.getArgByIndex(1);
  }

  getResolveOffset(): (offset: string) => void {
    return this.getArgByIndex(2);
  }

  getHeartbeat(): () => Promise<void> {
    return this.getArgByIndex(3);
  }

  getPause(): () => void {
    return this.getArgByIndex(4);
  }

  getCommitOffsetsIfNecessary(): (offsets?: Offsets) => Promise<void> {
    return this.getArgByIndex(5);
  }

  getUncommittedOffsets(): OffsetsByTopicPartition {
    return this.getArgByIndex(6)();
  }

  getIsRunning(): boolean {
    return this.getArgByIndex(7)();
  }

  getIsStale(): boolean {
    return this.getArgByIndex(8)();
  }
}
