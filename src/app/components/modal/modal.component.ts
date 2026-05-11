import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';

@Component({
  selector: 'cq-modal',
  imports: [CommonModule],
  styles: `
    .cq-hide-empty:empty {
      display: none;
    }

    .cq-modal-transition {
      visibility: hidden;
      opacity: 0;
      transition:
        opacity 0.1s ease,
        visibility 0s linear 0.1s;

      &[open] {
        visibility: visible;
        opacity: 1;
        transition:
          opacity 0.1s ease,
          visibility 0s linear 0s;
      }

      .footer:empty {
        display: none;
      }
    }
  `,
  template: `
    <!-- Header -->
    <!-- <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100"> -->
    <div
      [attr.open]="open() ? '' : null"
      (click)="closeable() && open.set(false)"
      (keypress.escape)="closeable() && open.set(false)"
      tabindex="-1"
      class="cq-modal-transition absolute flex fixed w-dvw h-dvh z-100 inset-0 justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        [class]="
          modalClasses() + ' flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'
        "
        (click)="$event.stopPropagation()"
        (keypress.enter)="($event)"
        tabindex="0"
      >
        <div class="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-gray-900"><ng-content select="[title]" /></h2>
              <p class="text-sm text-gray-500 mt-0.5"><ng-content select="[subtitle]" /></p>
            </div>
            @if (closeable()) {
              <button
                type="button"
                class="cursor-pointer text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center"
                (click)="open.set(false)"
              >
                <svg
                  class="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18 17.94 6M18 18 6.06 6"
                  />
                </svg>
                <span class="sr-only">Close modal</span>
              </button>
            }
          </div>
        </div>

        <div class="flex-1 overflow-y-auto space-y-6">
          <ng-content select="[body]" />
        </div>

        <div
          class="footer sticky bottom-0 z-10 border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end gap-3"
        >
          <ng-content select="[footer]" />
        </div>
      </div>
    </div>
    <!-- </div> -->
  `,
})
export class ModalComponent {
  readonly open = model.required<boolean>();
  readonly closeable = input(true);
  readonly modalClasses = input('max-w-lg max-h-[90vh] mt-auto mb-auto');
}
