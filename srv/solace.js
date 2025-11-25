"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cds_1 = __importStar(require("@sap/cds"));
const solclientjs_1 = require("solclientjs");
class Solace extends cds_1.MessagingService {
    session;
    isConnected = false;
    log = cds_1.default.log('solace');
    //@ts-ignore
    init() {
        //@ts-ignore
        const { hostName, vpnName, userName, password } = this.options.credentials;
        return new Promise((res) => {
            //@ts-ignore
            this.session = solclientjs_1.SolclientFactory.init({
                logLevel: solclientjs_1.LogLevel.INFO,
                profile: solclientjs_1.SolclientFactoryProfiles.version10_5
            }).createSession({
                url: hostName,
                vpnName: vpnName,
                userName: userName,
                password: password,
                reconnectRetries: 0
            });
            this.session.on(solclientjs_1.SessionEventCode.UP_NOTICE, () => {
                this.isConnected = true;
                res();
            })
                .on(solclientjs_1.SessionEventCode.DISCONNECTED, () => {
                this.isConnected = false;
            })
                .on(solclientjs_1.SessionEventCode.CONNECT_FAILED_ERROR, () => {
                this.isConnected = false;
            })
                .connect();
        })
            .catch((error) => {
            throw error;
        });
    }
    on(queue, handler) {
        if (this.isConnected) {
            this.session.createMessageConsumer({
                queueDescriptor: new solclientjs_1.QueueDescriptor({
                    name: queue,
                    type: solclientjs_1.QueueType.QUEUE
                }),
                acknowledgeMode: solclientjs_1.MessageConsumerAcknowledgeMode.CLIENT
            })
                .on(solclientjs_1.MessageConsumerEventName.UP, () => {
                this.log.info(`Subscribed to queue: ${queue}`);
            })
                .on(solclientjs_1.MessageConsumerEventName.MESSAGE, (message) => {
                if (handler && typeof handler === 'function') {
                    handler(JSON.parse(message.getBinaryAttachment()));
                    message.acknowledge();
                }
            })
                .connect();
        }
        else {
            throw new Error('Solace session is not connected');
        }
        return this;
    }
    //@ts-ignore
    emit(topic, payload) {
        return new Promise((res) => {
            const message = solclientjs_1.SolclientFactory.createMessage();
            message.setDestination(solclientjs_1.SolclientFactory.createTopicDestination(topic));
            message.setBinaryAttachment(JSON.stringify(payload));
            message.setDeliveryMode(solclientjs_1.MessageDeliveryModeType.PERSISTENT);
            message.setSenderTimestamp(new Date().getTime());
            if (this.isConnected) {
                this.session.send(message);
            }
            else {
                throw new Error('Solace session is not connected');
            }
            res();
        })
            .catch((error) => {
            throw error;
        });
    }
}
exports.default = Solace;
