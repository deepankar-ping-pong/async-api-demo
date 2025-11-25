import cds, { MessagingService } from '@sap/cds';
import {
    SolclientFactory,
    LogLevel,
    SolclientFactoryProfiles,
    Session,
    SessionEventCode,
    Message,
    MessageDeliveryModeType,
    MessageConsumerAcknowledgeMode,
    QueueType,
    MessageConsumerEventName,
    QueueDescriptor
} from 'solclientjs'

export default class Solace extends MessagingService {
    session!: Session
    isConnected: boolean = false
    log = cds.log('solace')
    //@ts-ignore
    public init(): Promise<void> {
        //@ts-ignore
        const { hostName, vpnName, userName, password } = this.options.credentials
        return new Promise((res: (value: void) => void) => {
            //@ts-ignore
            this.session = SolclientFactory.init({
                logLevel: LogLevel.INFO,
                profile: SolclientFactoryProfiles.version10_5
            }).createSession({
                url: hostName,
                vpnName: vpnName,
                userName: userName,
                password: password,
                reconnectRetries: 0
            })
            this.session.on(SessionEventCode.UP_NOTICE, () => {
                this.isConnected = true
                res()
            })
                .on(SessionEventCode.DISCONNECTED, () => {
                    this.isConnected = false
                })
                .on(SessionEventCode.CONNECT_FAILED_ERROR, () => {
                    this.isConnected = false
                })
                .connect()
        })
            .catch((error: Error) => {
                throw error
            })
    }
    public on(queue: string, handler?: unknown): this {
        if (this.isConnected) {
            this.session.createMessageConsumer({
                queueDescriptor: new QueueDescriptor({
                    name: queue,
                    type: QueueType.QUEUE
                }),
                acknowledgeMode: MessageConsumerAcknowledgeMode.CLIENT
            })
                .on(MessageConsumerEventName.UP, () => {
                    this.log.info(`Subscribed to queue: ${queue}`)
                })
                .on(MessageConsumerEventName.MESSAGE, (message: Message) => {
                    if (handler && typeof handler === 'function') {
                        (handler as Function)(JSON.parse(message.getBinaryAttachment() as string))
                        message.acknowledge()
                    }
                })
                .connect()
        }
        else {
            throw new Error('Solace session is not connected')
        }
        return this
    }
    //@ts-ignore
    public emit(topic: string, payload: any): Promise<any> {
        return new Promise((res: (value: void) => void) => {
            const message: Message = SolclientFactory.createMessage()
            message.setDestination(SolclientFactory.createTopicDestination(topic))
            message.setBinaryAttachment(JSON.stringify(payload))
            message.setDeliveryMode(MessageDeliveryModeType.PERSISTENT)
            message.setSenderTimestamp(new Date().getTime())
            if (this.isConnected) {
                this.session.send(message)
            }
            else {
                throw new Error('Solace session is not connected')
            }
            res()
        })
            .catch((error: Error) => {
                throw error
            })
    }
}