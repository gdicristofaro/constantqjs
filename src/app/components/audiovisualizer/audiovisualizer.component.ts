import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
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
    <div class="absolute inset-0 w-full h-full p-5 flex items-center">
      <div class="overflow-x-auto h-full" [style.min-width]="'calc(' + containerWidth() + ')'">
        <div class="relative h-full" [style.width]="canvasWidth()">
          <canvas #chartElement></canvas>
        </div>
      </div>
    </div>
  `,
})
export class AudioVisualizerComponent implements AfterViewInit {
  chartElement = viewChild<ElementRef<HTMLCanvasElement>>('chartElement');

  private static readonly LINE_COLOR = undefined;
  private static readonly REM_PER_LABEL = 0.75; // Estimated width per label

  private readonly audioSvc = inject(AudioPlaybackService);
  private readonly audioLoadSvc = inject(AudioLoadService);

  readonly audioFileData = computed(
    () => this.audioLoadSvc.audioFileData() ?? ({} as AudioFileData),
  );

  private readonly constantQSvc = inject(ConstantqService);

  readonly title = computed(() => this.audioFileData().title);
  readonly pitches = computed(() => this.audioFileData().noteLetters);
  readonly max = computed(() => this.constantQSvc.constantQData()?.graphMax ?? 0);

  private getContainerWidth(windowWidthPx: number) {
    return `${windowWidthPx}px - (var(--spacing) * 5)`;
  }

  readonly containerWidth = signal(this.getContainerWidth(window.innerWidth));

  readonly canvasWidth = computed(() => {
    const labelCount = this.pitches()?.length ?? 0;
    return `max(${this.containerWidth()}, ${labelCount * AudioVisualizerComponent.REM_PER_LABEL}rem)`;
  });

  @HostListener('window:resize')
  onResize() {
    this.containerWidth.set(this.getContainerWidth(window.innerWidth));
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
    this.reloadChart();
  }

  reloadChart() {
    const ctx = this.chartElement()?.nativeElement;

    if (!ctx) {
      return;
    }

    this.chart?.destroy();

    const pitches = this.pitches();
    const pitchData = this.pitchData();

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
          },
          x: {
            ticks: {
              autoSkip: false, // Disables automatic label removal
              maxRotation: 90, // Optional: Rotate labels to prevent overlap
              minRotation: 45, // Optional: Ensure labels remain readable
            },
          },
        },
      },
      data: {
        labels: pitches,
        datasets: [{ borderColor: AudioVisualizerComponent.LINE_COLOR, data: pitchData }],
      },
    });

    // TODO fix these
    // this.chart.datasets = this.chartData;
    // this.chart.labels = this.pitches();
    // this.chart.colors = this.lineChartColors;
    // this.chart.legend = this.lineChartLegend;
    // this.chart.chartType = this.lineChartType;
  }

  // // the colors for the chart
  // lineChartColors: Color[] = [
  //   {
  //     // grey
  //     backgroundColor: 'rgba(148,159,177,0.2)',
  //     borderColor: 'rgba(148,159,177,1)',
  //     pointBackgroundColor: 'rgba(148,159,177,1)',
  //     pointBorderColor: '#fff',
  //     pointHoverBackgroundColor: '#fff',
  //     pointHoverBorderColor: 'rgba(148,159,177,0.8)',
  //   },
  // ];
}
