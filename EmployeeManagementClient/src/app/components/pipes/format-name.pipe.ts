import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'formatName',
	standalone: true
})
export class FormatNamePipe implements PipeTransform {
	transform(value: { firstName: string; lastName: string; middleName?: string }): string {
		return `${value.lastName} ${value.firstName} ${value.middleName || ''}`.trim();
	}
}
