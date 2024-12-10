import { ClientKafka, ReadPacket } from '@nestjs/microservices';
import { Observable } from 'rxjs';
export type NestjsKafkaBatchTopicMessage<TInput = any> = {
    pattern: any;
    data: TInput[];
};
export declare class KafkaBatchClient extends ClientKafka {
    protected publish(): () => void;
    emitBatch<TResult = any, TInput = any>(pattern: any, data: {
        messages: TInput[];
    }): Observable<TResult>;
    protected dispatchBatchEvent<TInput = any>(packets: ReadPacket<{
        messages: TInput[];
    }>): Promise<any>;
    emitBatchTopics<TResult = any, TInput = any>(topicMessages: NestjsKafkaBatchTopicMessage<TInput>[]): Observable<TResult>;
    protected dispatchBatchTopics<TInput = any>(topicMessages: NestjsKafkaBatchTopicMessage<TInput>[]): Promise<any>;
}
