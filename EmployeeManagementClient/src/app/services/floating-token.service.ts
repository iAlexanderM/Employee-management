// src/app/services/floating-token.service.ts
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Overlay, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ActiveTokenComponent } from '../components/modals/active-token/active-token-floating.component';
import { QueueToken } from '../models/queue.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class FloatingTokenService implements OnDestroy {
	private overlay = inject(Overlay);
	private overlayRef: OverlayRef | null = null;
	private readonly destroy$ = new Subject<void>();

	constructor() { }

	open(tokenData: QueueToken): void {
		if (this.overlayRef && this.overlayRef.hasAttached()) {
			this.close();
		}

		const positionStrategy: PositionStrategy = this.overlay.position()
			.global()
			.centerHorizontally()
			.centerVertically();

		this.overlayRef = this.overlay.create({
			positionStrategy: positionStrategy,
			hasBackdrop: false,
			scrollStrategy: this.overlay.scrollStrategies.reposition(),
			panelClass: 'floating-token-overlay-panel',
		});

		// ИСПРАВЛЕНИЕ ЗДЕСЬ: используем ActiveTokenComponent
		const componentPortal = new ComponentPortal(ActiveTokenComponent);
		const componentRef = this.overlayRef.attach(componentPortal);

		if (componentRef.instance) {
			// Это обращение к инстансу компонента
			componentRef.instance.tokenData = tokenData;
			// ИСПРАВЛЕНИЕ ЗДЕСЬ: обращение к output 'close' компонента
			componentRef.instance.close
				.pipe(takeUntil(this.destroy$))
				.subscribe(() => {
					this.close();
				});
		}
	}

	close(): void {
		if (this.overlayRef) {
			this.overlayRef.dispose();
			this.overlayRef = null;
		}
	}

	isOpen(): boolean {
		return !!this.overlayRef && this.overlayRef.hasAttached();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		this.close();
	}
}