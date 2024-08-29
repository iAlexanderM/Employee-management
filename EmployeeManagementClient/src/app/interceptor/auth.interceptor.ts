import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

	constructor(private authService: AuthService) { }

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const authToken = this.authService.getToken();

		if (authToken) {
			const cloned = req.clone({
				headers: req.headers.set('Authorization', `Bearer ${authToken}`)
			});
			return next.handle(cloned);
		} else {
			return next.handle(req);
		}
	}
}
