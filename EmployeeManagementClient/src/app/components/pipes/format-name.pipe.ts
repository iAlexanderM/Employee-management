import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'formatName'
})
export class FormatNamePipe implements PipeTransform {

	transform(firstName: string, lastName: string, middleName?: string): string {
		return `${lastName} ${firstName} ${middleName ? middleName : ''}`.trim();
	}

}
