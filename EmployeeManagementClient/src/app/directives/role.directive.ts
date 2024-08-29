import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
	selector: '[appRole]'
})
export class RoleDirective {
	constructor(
		private templateRef: TemplateRef<any>,
		private viewContainer: ViewContainerRef,
		private authService: AuthService
	) { }

	@Input() set appRole(role: string) {
		const user = this.authService.getCurrentUser();
		if (user && user.roles.includes(role)) {
			this.viewContainer.createEmbeddedView(this.templateRef);
		} else {
			this.viewContainer.clear();
		}
	}
}
