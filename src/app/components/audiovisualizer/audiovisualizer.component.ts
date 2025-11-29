import { Component, effect, ElementRef, input, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';

/**
 * responsible for visualizing spectral audio data
 */
@Component({
  selector: 'audio-visualizer',
  templateUrl: 'audiovisualizer.component.html',
})
export class AudioVisualizerComponent {
  @ViewChild('chart') chartEl: ElementRef | undefined;

  readonly title = input.required<string>();
  // pitches chart labels
  readonly pitches = input.required<string[]>();
  // the maximum value to display on the axis
  readonly max = input.required<number>();

  // the data to display on the chart
  readonly pitchData = input.required<number[]>();

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
        this.chart.data.datasets[0] = { data: pitchData };
      } else {
        this.reloadChart();
      }
    });
  }

  reloadChart() {
    const ctx = this.chartEl?.nativeElement?.getContext('2d');

    if (!ctx) {
      return;
    }

    this.chart?.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
      data: {
        labels: this.pitches(),
        datasets: [{ data: this.pitchData() }],
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
