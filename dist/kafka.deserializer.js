"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaBatchDeserializer = void 0;
const incoming_request_deserializer_1 = require("@nestjs/microservices/deserializers/incoming-request.deserializer");
class KafkaBatchDeserializer extends incoming_request_deserializer_1.IncomingRequestDeserializer {
    mapToSchema(data, options) {
        if (!options) {
            return {
                pattern: undefined,
                data: undefined,
            };
        }
        return {
            pattern: options.channel,
            data: data?.map((message) => message.value),
        };
    }
}
exports.KafkaBatchDeserializer = KafkaBatchDeserializer;
//# sourceMappingURL=kafka.deserializer.js.map