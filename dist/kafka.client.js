"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaBatchClient = void 0;
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const invalid_message_exception_1 = require("@nestjs/microservices/errors/invalid-message.exception");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
class KafkaBatchClient extends microservices_1.ClientKafka {
    publish() {
        throw new Error('Do not use message pattern with batch processing');
    }
    emitBatch(pattern, data) {
        if ((0, shared_utils_1.isNil)(pattern) || (0, shared_utils_1.isNil)(data)) {
            return (0, rxjs_1.throwError)(() => new invalid_message_exception_1.InvalidMessageException());
        }
        const source = (0, rxjs_1.defer)(async () => this.connect()).pipe((0, rxjs_1.mergeMap)(() => this.dispatchBatchEvent({ pattern, data })));
        const connectableSource = (0, rxjs_1.connectable)(source, {
            connector: () => new rxjs_1.Subject(),
            resetOnDisconnect: false,
        });
        connectableSource.connect();
        return connectableSource;
    }
    async dispatchBatchEvent(packets) {
        if (packets.data.messages.length === 0) {
            return;
        }
        const pattern = this.normalizePattern(packets.pattern);
        const outgoingEvents = await Promise.all(packets.data.messages.map(message => {
            return this.serializer.serialize(message, { pattern });
        }));
        const message = Object.assign({
            topic: pattern,
            messages: outgoingEvents,
        }, this.options.send || {});
        return this.producer.send(message);
    }
    emitBatchTopics(topicMessages) {
        if ((0, shared_utils_1.isNil)(topicMessages) || (0, shared_utils_1.isEmpty)(topicMessages)) {
            return (0, rxjs_1.throwError)(() => new invalid_message_exception_1.InvalidMessageException());
        }
        const source = (0, rxjs_1.defer)(async () => this.connect()).pipe((0, rxjs_1.mergeMap)(() => this.dispatchBatchTopics(topicMessages)));
        const connectableSource = (0, rxjs_1.connectable)(source, {
            connector: () => new rxjs_1.Subject(),
            resetOnDisconnect: false,
        });
        connectableSource.connect();
        return connectableSource;
    }
    async dispatchBatchTopics(topicMessages) {
        const serializedTopicMessages = await Promise.all(topicMessages.map(async (topicMessage) => {
            return {
                topic: this.normalizePattern(topicMessage.pattern),
                messages: await Promise.all(topicMessage.data.map(async (message) => {
                    return this.serializer.serialize(message, { pattern: topicMessage.pattern });
                })),
            };
        }));
        const message = Object.assign({
            topicMessages: serializedTopicMessages,
        }, this.options.send || {});
        return this.producer.sendBatch(message);
    }
}
exports.KafkaBatchClient = KafkaBatchClient;
//# sourceMappingURL=kafka.client.js.map