"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserService;
const cds_1 = __importDefault(require("@sap/cds"));
function UserService(srv) {
    const log = cds_1.default.log('solace', {
        label: 'solace'
    });
    cds_1.default.connect.to('solace')
        .then((solace) => {
        solace.on('sap_user_creation', (message) => {
            log.info('Message received:', message);
        });
    })
        .catch((error) => {
        log.error(error.message);
    });
    srv.on('createUser', (req) => {
        return cds_1.default.connect.to('solace')
            .then((solace) => {
            return solace.emit('myCompany/user/create/v1', req.data)
                .then(() => {
                log.info('Message sent successfully.');
                req.reply(true);
            });
        })
            .catch((error) => {
            log.error(error.message);
            req.error(500, error.message);
        });
    });
}
