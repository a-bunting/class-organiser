import { HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthenticationService, User } from "../services/authentication.service";

@Injectable()

export class AuthInterceptor implements HttpInterceptor {

    constructor(private auth: AuthenticationService) {}

    // add the token to all outgoing requests...
    intercept(req: HttpRequest<any>, next: HttpHandler) {

        const token: string = this.auth.token();

        // create a clone of the request to avoid bad things
        const reqClone: HttpRequest<any> = req.clone({
            headers: req.headers.set('Authorization', "Bearer " + token)
        });

        return next.handle(reqClone);
    }
}
