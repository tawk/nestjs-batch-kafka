"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaBatchServer = void 0;
const microservices_1 = require("@nestjs/microservices");
const kafka_deserializer_1 = require("./kafka.deserializer");
const kafka_context_1 = require("./kafka.context");
const common_1 = require("@nestjs/common");
class KafkaBatchServer extends microservices_1.ServerKafka {
    constructor(options) {
        super(options);
        this.options = options;
        this.logger = new common_1.Logger(KafkaBatchServer.name);
    }
    async bindEvents(consumer) {
        const registeredPatterns = [...this.messageHandlers.keys()];
        const consumerSubscribeOptions = this.options.subscribe || {};
        if (registeredPatterns.length > 0) {
            await this.consumer.subscribe({
                ...consumerSubscribeOptions,
                topics: registeredPatterns,
            });
        }
        console.log(JSON.stringify(this.options.run, null, 2), 'CHECK: this.options.run');
        const consumerRunOptions = Object.assign(this.options.run || {}, {
            eachBatch: this.getMessageHandler(),
        });
        await consumer.run(consumerRunOptions);
    }
    getMessageHandler() {
        return async (payload) => this.handleMessage(payload);
    }
    async handleMessage(payload) {
        this.logger.log('[KAFKA] Batch messages received', 'handleMessage', {
            topicName: payload.batch.topic,
            partition: payload.batch.partition,
            numberOfMessages: payload.batch.messages.length,
            firstOffset: payload.batch.firstOffset(),
            lastOffset: payload.batch.lastOffset(),
        });
        const channel = payload.batch.topic;
        const rawMessages = [];
        for (const message of payload.batch.messages) {
            rawMessages.push(this.parser.parse(Object.assign(message, {
                topic: channel,
                partition: payload.batch.partition,
            })));
        }
        const packet = await this.deserializer.deserialize(rawMessages, {
            channel,
        });
        const kafkaContext = new kafka_context_1.KafkaBatchContext([
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
        return this.handleEvent(packet.pattern, packet, kafkaContext);
    }
    initializeDeserializer(options) {
        this.deserializer = options.deserializer ?? new kafka_deserializer_1.KafkaBatchDeserializer();
    }
}
exports.KafkaBatchServer = KafkaBatchServer;
//# sourceMappingURL=kafka.server.js.map