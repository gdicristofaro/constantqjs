import { Component } from '@angular/core';

@Component({
  selector: 'cq-or-divider',
  imports: [],
  template: ` <div class="relative flex items-center mt-4 mb-4">
    <div class="flex-grow border-t border-gray-200"></div>
    <span class="mx-4 flex-shrink text-sm italic text-gray-400">or</span>
    <div class="flex-grow border-t border-gray-200"></div>
  </div>`,
})
export class OrDividerComponent {}
