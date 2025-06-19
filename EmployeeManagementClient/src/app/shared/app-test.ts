import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'app-test',
	standalone: true,
	imports: [MatButtonModule],
	template: `
        <button mat-tonal-button color="primary">Tonal Button</button>
        <button mat-raised-button color="primary">Raised Button</button>
        <button mat-flat-button color="primary">Flat Button</button>
    `,
})
export class TestComponent { }