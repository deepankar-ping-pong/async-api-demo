using {com.mycompany as company} from './external/User Creation-0.1.0-default';

define service UserService {
    event userCreated : company.User.create.v1;
    action createUser(firstName: String, lastName: String, email: String) returns Boolean;
}
