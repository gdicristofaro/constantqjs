import { CommonModule } from '@angular/common';
import { Component, contentChild, input } from '@angular/core';

@Component({
  selector: 'cq-modal',
  imports: [CommonModule],
  styles: `
    .cq-hide-empty:empty {
      display: none;
    }
  `,
  template: `
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div
        [class]="
          (open() ? 'opacity-100 z-90' : 'opacity-0 z-0') +
          ' transition-opacity duration-500 fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm p-4'
        "
      >
        <div
          [class]="
            modalClasses() + ' flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'
          "
        >
          <div class="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
            <div>
              <h2 class="text-base font-semibold text-gray-900"><ng-content select="[title]" /></h2>
              <p class="text-sm text-gray-500 mt-0.5"><ng-content select="[subtitle]" /></p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto space-y-6">
            <ng-content select="[body]" />
          </div>

          <div
            class="sticky bottom-0 z-10 border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end gap-3"
          >
            <ng-content select="[footer]" />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  protected readonly titleContent = contentChild('title');
  readonly open = input(false);
  readonly modalClasses = input('max-w-lg max-h-[50vh] mt-[15vh]');
}
