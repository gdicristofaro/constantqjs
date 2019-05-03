import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType } from 'chart.js';

/**
 * responsible for visualizing spectral audio data
 */
@Component({
  selector: 'audio-visualizer',
  templateUrl: 'audiovisualizer.component.html'
})
export class AudioVisualizerComponent implements OnInit {
  @Input() title: string = undefined;

  // the category axis labels
  @Input() pitches: Array<any> = undefined;

  @ViewChild("baseChart") chart: BaseChartDirective;

  pitchDataSub : Subscription;

  // the maximum value to display on the axis
  _max: number;
  get max(): number {
    return this._max;
  }

  @Input('max')
  set max(value: number) {
    this._max = value;
    this.reloadChart(value);
  }

  // redraw via: https://github.com/valor-software/ng2-charts/issues/806
  reloadChart(newMax: number) {
    if (this.chart !== undefined && this.chart.chart) {
      this.chart.chart.destroy();
      //this.chart.chart = 0;

      this.chart.datasets = this.chartData;
      this.chart.labels = this.pitches;

      this.chart.options = {
        responsive: true,
        scales: {
          yAxes: [{
            ticks: {
              min: 0,
              max: newMax
            }
          }]
        }
      };

      this.chart.colors = this.lineChartColors;
      this.chart.legend = this.lineChartLegend;
      this.chart.chartType = this.lineChartType;

      this.chart.ngOnInit();
    }
    //(this.chart as any).refresh();


    //this.chart.ngOnChanges();
  }


  // the array of data to display
  private destArr: number[];

  // displays the chart data on the table
  get chartData(): any[] {
    return [{ data: this.destArr }];
  }

  // the subject with data to display on the chart
  @Input() pitchData: BehaviorSubject<number[]>;

  ngOnInit(): void {
    // subscribe to the listener and update the array accordingly
    this.pitchDataSub = this.pitchData.subscribe((data) => { this.destArr = data; });
  }

  ngOnDestroy() {
    this.pitchDataSub.unsubscribe();
  }

  // chart.js options for display
  get lineChartOptions(): any {
    return {
      responsive: true,
      scales: {
        yAxes: [{
          ticks: {
            min: 0,
            max: this.max
          }
        }]
      }
    };
  }

  // the colors for the chart
  lineChartColors: Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  lineChartLegend: boolean = false;
  lineChartType: ChartType = 'line';
}