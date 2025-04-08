import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'transformToUrl', standalone: true })
export class TransformToUrlPipe implements PipeTransform {
	transform(filePath: string): string {
		return `http://localhost:8080/${filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '')}`;
	}
}