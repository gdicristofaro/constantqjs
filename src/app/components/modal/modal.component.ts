import { ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';

@Component({
  selector: 'cq-modal',
  styles: `
    @starting-style {
      dialog[open] {
        opacity: 0;

        &::backdrop {
          opacity: 0;
        }
      }
    }

    dialog[open].is-closing {
      opacity: 0;

      &::backdrop {
        opacity: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialogEl
      tabindex="0"
      [class]="
        modalClasses() +
        ' duration-' +
        TRANSITION_TIME +
        ' backdrop:duration-' +
        TRANSITION_TIME +
        ' backdrop:transition-opacity transition-opacity ' +
        ' opacity-0 open:opacity-100 backdrop:opacity-0 open:backdrop:opacity-100 ' +
        ' p-0 border-0 m-auto w-full flex flex-col overflow-hidden rounded-2xl backdrop:backdrop-blur-sm ' +
        ' bg-neutral-primary shadow-2xl dark:shadow-black backdrop:bg-black/50  '
      "
      (cancel)="handleCancel($event)"
      (close)="close()"
      (click)="handleBackdropClick($event)"
      (keydown.escape)="closeable() && close()"
    >
      <div class="sticky top-0 z-10 border-b border-default-soft bg-neutral-primary px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-mediumbold text-body-strong">
              <ng-content select="[title]" />
            </h2>
            <p class="text-sm text-body mt-0.5"><ng-content select="[subtitle]" /></p>
          </div>
          @if (closeable()) {
            <button
              type="button"
              class="cursor-pointer text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center"
              (click)="close()"
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
        class="footer empty:hidden sticky bottom-0 z-10 border-t border-default-soft bg-neutral-secondary px-6 py-4 flex justify-end gap-3"
      >
        <ng-content select="[footer]" />
      </div>
    </dialog>
  `,
})
export class ModalComponent {
  protected readonly TRANSITION_TIME = 200;

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogEl');
  readonly closeable = input(true);
  readonly modalClasses = input('max-w-lg max-h-[90vh]');

  isOpen(): boolean {
    return this.dialogRef()?.nativeElement?.open ?? false;
  }

  open(): void {
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.focus();
      dialog.showModal();
      // dialog.focus();
    }
  }

  close(): void {
    const dialog = this.dialogRef()?.nativeElement;
    if (!dialog) {
      return;
    }
    if (dialog.open) {
      dialog.classList.add('is-closing');
      setTimeout(() => {
        dialog?.close();
        dialog?.classList?.remove('is-closing');
      }, this.TRANSITION_TIME);
    }
  }

  protected handleCancel(event: Event): void {
    if (!this.closeable()) {
      this.close();
      event.preventDefault();
    }
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (this.closeable() && event.target === event.currentTarget) {
      this.close();
    }
  }
}
