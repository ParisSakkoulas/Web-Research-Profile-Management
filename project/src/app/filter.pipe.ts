import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterPipe'
})
export class FilterPipePipe implements PipeTransform {

  transform(tags: any[], searchTerm: string): any[] {
    if (!tags) {
      return [];
    }
    if (!searchTerm) {
      return tags;
    }
    return tags.filter(tag => tag.keyword.toLowerCase().includes(searchTerm.toLowerCase()));
  }

}
