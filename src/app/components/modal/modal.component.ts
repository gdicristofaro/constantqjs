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
    <div
      [class]="
        (open() ? 'opacity-100 z-90' : 'opacity-0 z-0') +
        ' transition-opacity duration-500 fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'
      "
    >
      <div
        [class]="
          modalClasses() +
          ' flex w-full max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'
        "
      >
        <div class="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
          <h3 class="text-xl font-semibold text-gray-800">
            <ng-content select="[title]" />
          </h3>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <ng-content select="body" />
        </div>

        <div
          class="sticky bottom-0 z-10 border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end gap-3"
        >
          <ng-content select="footer" />
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  protected readonly titleContent = contentChild('title');
  readonly open = input(false);
  readonly modalClasses = input('max-w-5xl');
}
