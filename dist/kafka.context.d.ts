import { BaseRpcContext } from '@nestjs/microservices';
import type { Consumer, KafkaMessage, Offsets, OffsetsByTopicPartition } from 'kafkajs';
type KafkaBatchContextArgs = [
    messages: KafkaMessage[],
    consumer: Consumer,
    resolveOffset: (offset: string) => void,
    heartbeat: () => Promise<void>,
    pause: () => void,
    commitOffsetsIfNecessary: (offsets?: Offsets) => Promise<void>,
    uncommittedOffsets: () => OffsetsByTopicPartition,
    isRunning: () => boolean,
    isStale: () => boolean
];
export declare class KafkaBatchContext extends BaseRpcContext<KafkaBatchContextArgs> {
    constructor(args: KafkaBatchContextArgs);
    getMessages(): KafkaMessage[];
    getConsumer(): Consumer;
    getResolveOffset(): (offset: string) => void;
    getHeartbeat(): () => Promise<void>;
    getPause(): () => void;
    getCommitOffsetsIfNecessary(): (offsets?: Offsets) => Promise<void>;
    getUncommittedOffsets(): OffsetsByTopicPartition;
    getIsRunning(): boolean;
    getIsStale(): boolean;
}
export {};
