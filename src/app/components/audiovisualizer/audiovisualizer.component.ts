import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Chart } from 'chart.js/auto';
import AudioFileData from '../../model/audiofiledata';
import { AudioLoadService } from '../../services/audio-load.service';
import { AudioPlaybackService } from '../../services/audio-playback.service';
import { ConstantqService } from '../../services/constantq.service';

/**
 * responsible for visualizing spectral audio data
 */
@Component({
  selector: 'cq-audio-visualizer',
  template: `
    <div class="absolute inset-3 flex items-center">
      <div #container class="overflow-x-auto w-full h-full">
        <div class="relative h-full" [style.width]="canvasWidth()">
          <canvas #chartElement></canvas>
        </div>
      </div>
    </div>
  `,
  host: {
    '[class.hidden]': '!show()',
  },
})
export class AudioVisualizerComponent implements AfterViewInit, OnDestroy {
  protected readonly chartElement = viewChild<ElementRef<HTMLCanvasElement>>('chartElement');
  protected readonly container = viewChild<ElementRef<HTMLDivElement>>('container');

  private static readonly REM_PER_LABEL = 0.75; // Estimated width per label

  readonly show = input.required<boolean>();
  private readonly audioSvc = inject(AudioPlaybackService);
  private readonly audioLoadSvc = inject(AudioLoadService);

  readonly audioFileData = computed(
    () => this.audioLoadSvc.audioFileData() ?? ({} as AudioFileData),
  );

  private readonly constantQSvc = inject(ConstantqService);

  readonly title = computed(() => this.audioFileData().title);
  readonly pitches = computed(() => this.audioFileData().noteLetters);
  readonly max = computed(() => this.constantQSvc.constantQData()?.graphMax ?? 0);

  private readonly darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private colorModeChangeListener?: any;

  private getContainerWidth() {
    // equivalent to full screen width minus the insets (3)
    return `${window.innerWidth}px - (var(--spacing) * 6)`;
  }

  readonly containerWidth = signal(this.getContainerWidth());

  readonly canvasWidth = computed(() => {
    const labelCount = this.pitches()?.length ?? 0;
    return `max(${this.containerWidth()}, ${labelCount * AudioVisualizerComponent.REM_PER_LABEL}rem)`;
  });

  @HostListener('window:resize')
  onResize() {
    this.containerWidth.set(this.getContainerWidth());
    this.reloadChart();
  }

  // the data to display on the chart
  readonly pitchData = computed<number[]>(() => {
    const { fps } = this.audioFileData();
    const { constantQData } = this.constantQSvc.constantQData() || { constantQData: [] };
    const pos = this.audioSvc.curPosition();
    const idx = Math.floor((pos ?? 1) * (fps ?? 1));
    const frame = (constantQData?.length ?? 0) > idx ? constantQData[idx] : [];
    return frame;
  });

  private chart: Chart<'line', number[], string> | undefined = undefined;

  /**
   * Reads a theme color resolved for the current color scheme.
   * Uses the --lightmode-* / --darkmode-* sub-variables defined in theme.scss
   * so Chart.js receives a concrete color value rather than a light-dark() expression.
   */
  private getThemeColor(varName: string, colorScheme: 'dark' | 'light'): string {
    const prefix = colorScheme === 'dark' ? '--darkmode' : '--lightmode';
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`${prefix}-${varName}`)
      .trim();
  }

  constructor() {
    effect(() => {
      this.pitches();
      this.max();
      untracked(() => {
        this.reloadChart();
      });
    });

    effect(() => {
      const pitchData = this.pitchData();
      untracked(() => {
        if (this.chart) {
          this.chart.data.datasets[0].data = pitchData;
          this.chart.update();
        } else {
          console.log('reloading for change: ', pitchData);
          this.reloadChart();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.colorModeChangeListener = () => this.reloadChart();
    this.darkModePreference.addEventListener('change', this.colorModeChangeListener);
    this.containerWidth.set(this.getContainerWidth());
    this.reloadChart();
  }

  ngOnDestroy(): void {
    if (this.darkModePreference && this.colorModeChangeListener) {
      this.darkModePreference.removeEventListener('change', this.colorModeChangeListener);
    }
  }

  reloadChart() {
    const ctx = this.chartElement()?.nativeElement;

    if (!ctx) {
      return;
    }

    this.chart?.destroy();

    const pitches = this.pitches();
    const pitchData = this.pitchData();

    // Read theme colors at render time so light/dark mode is respected
    const colorScheme: 'dark' | 'light' = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const lineColor = this.getThemeColor('color-brand-medium', colorScheme);
    const fillColor = this.getThemeColor('color-brand-soft', colorScheme);
    const textColor = this.getThemeColor('color-body-subtle', colorScheme);
    const gridColor = this.getThemeColor('color-default', colorScheme);
    const neutralColor = this.getThemeColor('color-neutral-primary', colorScheme);

    this.chart = new Chart(ctx, {
      type: 'line',
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            min: 0,
            max: this.max() ?? 1,
            ticks: {
              color: textColor,
            },
            grid: {
              color: gridColor,
            },
          },
          x: {
            ticks: {
              autoSkip: false, // Disables automatic label removal
              maxRotation: 90, // Optional: Rotate labels to prevent overlap
              minRotation: 45, // Optional: Ensure labels remain readable
              color: textColor,
            },
            grid: {
              color: context => {
                return context.index % 2 === 0 ? gridColor : 'transparent';
              },
            },
          },
        },
      },
      data: {
        labels: pitches,
        datasets: [
          {
            data: pitchData,
            borderColor: lineColor,
            backgroundColor: fillColor,
            pointBackgroundColor: lineColor,
            pointBorderColor: neutralColor,
            pointHoverBackgroundColor: neutralColor,
            pointHoverBorderColor: lineColor,
            fill: true,
          },
        ],
      },
    });
  }
}
