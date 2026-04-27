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
        ' transition-opacity duration-500 fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'
      "
    >
      <div class="w-full max-w-md max-h-[90vh] rounded-2xl bg-white shadow-2xl">
        <div class="cq-hide-empty sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
          <h3 class="text-xl font-semibold text-gray-800">
            <ng-content select="[title]" />
          </h3>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto cq-hide-empty">
          <ng-content select="body" />
        </div>

        <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 cq-hide-empty">
          <ng-content select="footer" />
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  protected readonly titleContent = contentChild('title');
  readonly open = input(false);
}
