import cds from "@sap/cds";

export default function UserService(srv: cds.Service) {
    const log = cds.log('solace', {
        label: 'solace'
    })
    cds.connect.to('solace')
        .then((solace: cds.Service) => {
            solace.on('sap_user_creation', (message: any) => {
                log.info('Message received:', message)
            })
        })
        .catch((error: Error) => {
            log.error(error.message)
        })
    srv.on('createUser', (req: cds.Request) => {
        return cds.connect.to('solace')
            .then((solace: cds.Service) => {
                return solace.emit('myCompany/user/create/v1', req.data)
                    .then(() => {
                        log.info('Message sent successfully.')
                        req.reply(true)
                    })
            })
            .catch((error: Error) => {
                log.error(error.message)
                req.error(500, error.message)
            })
    })
}