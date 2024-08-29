import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
	selector: '[appRole]',
	standalone: true
})
export class RoleDirective implements OnInit {
	@Input() appRole!: string;

	constructor(
		private templateRef: TemplateRef<any>,
		private viewContainer: ViewContainerRef,
		private authService: AuthService
	) { }

	ngOnInit(): void {
		const hasAccess = this.authService.isAuthenticated();
		if (hasAccess) {
			this.viewContainer.createEmbeddedView(this.templateRef);
		} else {
			this.viewContainer.clear();
		}
	}
}
