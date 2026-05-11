import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
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
  templateUrl: 'audiovisualizer.component.html',
})
export class AudioVisualizerComponent implements AfterViewInit {
  chartElement = viewChild<ElementRef<HTMLCanvasElement>>('chartElement');

  private readonly audioSvc = inject(AudioPlaybackService);
  private readonly audioLoadSvc = inject(AudioLoadService);

  readonly audioFileData = computed(
    () => this.audioLoadSvc.audioFileData() ?? ({} as AudioFileData),
  );

  private readonly constantQSvc = inject(ConstantqService);

  readonly title = computed(() => this.audioFileData().title);
  readonly pitches = computed(() => this.audioFileData().noteLetters);
  readonly max = computed(() => this.constantQSvc.constantQData()?.graphMax ?? 0);

  // the data to display on the chart
  readonly pitchData = computed(() => {
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
      this.reloadChart();
    });

    effect(() => {
      const pitchData = this.pitchData();
      if (this.chart) {
        this.chart.data.datasets[0].data = pitchData;
        this.chart.update();
      } else {
        this.reloadChart();
      }
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
        responsive: true,
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
        },
      },
      data: {
        labels: pitches,
        datasets: [{ data: pitchData }],
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
