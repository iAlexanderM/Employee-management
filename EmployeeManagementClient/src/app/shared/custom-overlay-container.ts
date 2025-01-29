// src/app/shared/custom-overlay-container.ts
import { Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable()
export class CustomOverlayContainer extends OverlayContainer {
	protected override _createContainer(): void {
		const container = document.createElement('div');
		container.classList.add('cdk-overlay-container');

		// Ищем элемент, куда поместим оверлей (например, .local-overlay-root).
		const parent = document.querySelector('.local-overlay-root');
		if (!parent) {
			throw new Error('Не найден элемент .local-overlay-root');
		}

		parent.appendChild(container);
		this._containerElement = container;
	}
}
