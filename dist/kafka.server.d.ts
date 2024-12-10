import { KafkaOptions, ServerKafka } from '@nestjs/microservices';
import { Consumer, EachBatchHandler, EachBatchPayload } from '@nestjs/microservices/external/kafka.interface';
import { Logger } from '@nestjs/common';
export interface BatchKafkaOptionsConfig extends Omit<KafkaOptions['options'], 'producer' | 'producerOnlyMode'> {
    run?: BatchConsumerRunConfig;
}
export type BatchConsumerRunConfig = {
    autoCommit?: boolean;
    autoCommitInterval?: number;
    autoCommitThreshold?: number;
    eachBatchAutoResolve?: boolean;
    partitionsConsumedConcurrently?: number;
};
export declare class KafkaBatchServer extends ServerKafka {
    readonly options: BatchKafkaOptionsConfig;
    logger: Logger;
    constructor(options: BatchKafkaOptionsConfig);
    bindEvents(consumer: Consumer): Promise<void>;
    getMessageHandler(): EachBatchHandler;
    handleMessage(payload: EachBatchPayload): Promise<any>;
    protected initializeDeserializer(options: BatchKafkaOptionsConfig): void;
}
