import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
import { DecimalPipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import AudioFileData from '../../model/audiofiledata';
import { getFreqRange, Note, noteToString, Pitch } from '../../model/pitch';
import { AudioLoadService } from '../../services/audio-load.service';
import { AudioPlaybackService } from '../../services/audio-playback.service';
import { ConstantqService } from '../../services/constantq.service';
import { PianoKeyboardComponent } from './piano-keyboard.component';

type DisplayMode = 'graph' | 'keyboard' | 'both';

const NOTE_X_OFFSETS: Record<Note, number> = {
  [Note.C]: 0.5,
  [Note.CSharp]: 1.0,
  [Note.D]: 1.5,
  [Note.DSharp]: 2.0,
  [Note.E]: 2.5,
  [Note.F]: 3.5,
  [Note.FSharp]: 4.0,
  [Note.G]: 4.5,
  [Note.GSharp]: 5.0,
  [Note.A]: 5.5,
  [Note.ASharp]: 6.0,
  [Note.B]: 6.5,
};

/**
 * Responsible for visualizing spectral audio data as a chart and/or piano keyboard.
 */
@Component({
  selector: 'cq-audio-visualizer',
  imports: [PianoKeyboardComponent, DecimalPipe],
  templateUrl: './audiovisualizer.component.html',
  styleUrl: './audiovisualizer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hidden]': '!show()',
  },
})
export class AudioVisualizerComponent implements AfterViewInit, OnDestroy {
  protected readonly chartElement = viewChild<ElementRef<HTMLCanvasElement>>('chartElement');
  protected readonly container = viewChild<ElementRef<HTMLDivElement>>('container');

  private static readonly MIN_PX_PER_WHITE_KEY = 45;

  readonly show = input.required<boolean>();
  private readonly audioSvc = inject(AudioPlaybackService);
  private readonly audioLoadSvc = inject(AudioLoadService);

  readonly audioFileData = computed(
    () => this.audioLoadSvc.audioFileData() ?? ({} as AudioFileData),
  );

  private readonly constantQSvc = inject(ConstantqService);

  readonly max = computed(() => this.constantQSvc.constantQData()?.graphMax ?? 0);

  /** Pitches in the currently loaded audio's analysis range. */
  readonly pitchRange = computed<Pitch[]>(() => {
    const settings = this.audioFileData().settings;
    if (!settings?.minPitch || !settings?.maxPitch) {
      return [];
    } else {
      return getFreqRange(
        settings.minPitch.note,
        settings.minPitch.octave,
        settings.maxPitch.note,
        settings.maxPitch.octave,
      ) as Pitch[];
    }
  });

  readonly numOctaves = computed(() => {
    const range = this.pitchRange();
    if (!range.length) {
      return 1;
    } else {
      return range[range.length - 1].octave - range[0].octave + 1;
    }
  });

  /** X positions of each note in piano-key coordinate space (white key units). */
  readonly noteXPositions = computed(() => {
    const range = this.pitchRange();
    if (!range.length) {
      return [];
    } else {
      const baseOctave = range[0].octave;
      return range.map(p => (p.octave - baseOctave) * 7 + NOTE_X_OFFSETS[p.note]);
    }
  });

  private readonly darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private colorModeChangeListener?: any;

  private getContainerWidth() {
    return `${window.innerWidth}px - (var(--spacing) * 6)`;
  }

  readonly containerWidth = signal(this.getContainerWidth());

  readonly canvasWidth = computed(() => {
    const numWhiteKeys = this.numOctaves() * 7;
    const minPx = numWhiteKeys * AudioVisualizerComponent.MIN_PX_PER_WHITE_KEY;
    return `max(${this.containerWidth()}, ${minPx}px)`;
  });

  // the raw bin data for the current frame (2 bins per semitone)
  readonly pitchData = computed<number[]>(() => {
    const { fps } = this.audioFileData();
    const { constantQData } = this.constantQSvc.constantQData() || { constantQData: [] };
    const pos = this.audioSvc.curPosition();
    const idx = Math.floor((pos ?? 1) * (fps ?? 1));
    const frame = (constantQData?.length ?? 0) > idx ? constantQData[idx] : [];
    return frame;
  });

  /** One value per note — uses only the on-center bin for each semitone. */
  readonly noteData = computed<number[]>(() => {
    const pitchData = this.pitchData();
    const range = this.pitchRange();
    if (!range.length) {
      return [];
    } else {
      return range.map((_, i) => pitchData[2 * i] ?? 0);
    }
  });

  /**
   * Pitch name + current intensity per note. Backs the screen-reader-only data table that
   * provides a text alternative to the chart canvas.
   */
  readonly noteTable = computed<{ label: string; value: number }[]>(() => {
    const range = this.pitchRange();
    const data = this.noteData();
    return range.map((p, i) => ({
      label: `${noteToString(p.note)}${p.octave}`,
      value: data[i] ?? 0,
    }));
  });

  /** Per-note keyboard intensities for the current frame, precomputed during analysis. */
  readonly frameKeyboardIntensity = computed<number[]>(() => {
    const cqData = this.constantQSvc.constantQData();
    const { fps } = this.audioFileData();
    const pos = this.audioSvc.curPosition();
    const idx = Math.floor((pos ?? 0) * (fps ?? 1));
    const ki = cqData?.keyboardIntensity;
    return ki && idx < ki.length ? ki[idx] : [];
  });

  readonly displayMode = signal<DisplayMode>('both');
  readonly displayModes: { value: DisplayMode; label: string }[] = [
    { value: 'graph', label: 'Graph' },
    { value: 'keyboard', label: 'Keyboard' },
    { value: 'both', label: 'Both' },
  ];

  /** Left offset of chart plot area in pixels (for keyboard alignment). */
  readonly chartPlotLeft = signal(0);
  /** Right padding of chart plot area in pixels (for keyboard alignment). */
  readonly chartPlotRight = signal(0);

  selectDisplayMode(mode: DisplayMode): void {
    this.displayMode.set(mode);
    if (mode !== 'keyboard') {
      this.reloadChart();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.containerWidth.set(this.getContainerWidth());
    this.reloadChart();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chart: Chart<'line', any[], string> | undefined = undefined;

  private getThemeColor(varName: string, colorScheme: 'dark' | 'light'): string {
    const prefix = colorScheme === 'dark' ? '--darkmode' : '--lightmode';
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`${prefix}-${varName}`)
      .trim();
  }

  constructor() {
    // Reload chart when pitch range, max, display mode changes, or canvas appears after mode switch
    effect(() => {
      this.pitchRange();
      this.max();
      this.displayMode();
      this.chartElement();
      untracked(() => this.reloadChart());
    });

    // Update chart data in-place when the audio position advances
    effect(() => {
      const noteData = this.noteData();
      const xPositions = this.noteXPositions();
      untracked(() => {
        if (this.chart) {
          this.chart.data.datasets[0].data = xPositions.map((x, i) => ({ x, y: noteData[i] }));
          this.chart.update();
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
      this.chart?.destroy();
      this.chart = undefined;
      return;
    }

    this.chart?.destroy();

    const pitchRange = this.pitchRange();
    const noteData = this.noteData();
    const xPositions = this.noteXPositions();
    const numOctaves = this.numOctaves();
    const totalWidth = numOctaves * 7;

    const colorScheme: 'dark' | 'light' = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const lineColor = this.getThemeColor('color-brand-medium', colorScheme);
    const fillColor = this.getThemeColor('color-brand-soft', colorScheme);
    const textColor = this.getThemeColor('color-body-subtle', colorScheme);
    const gridColor = this.getThemeColor('color-default', colorScheme);
    const neutralColor = this.getThemeColor('color-neutral-primary', colorScheme);

    // Map x position → note label for tick callback
    const noteLabelMap = new Map<number, string>(
      xPositions.map((x, i) => [
        x,
        pitchRange[i] ? `${noteToString(pitchRange[i].note)}${pitchRange[i].octave}` : '',
      ]),
    );

    // Ticks at note centers AND at integer white-key boundaries (for grid lines)
    const boundaryTicks = Array.from({ length: totalWidth + 1 }, (_, i) => ({ value: i }));
    const noteTicks = xPositions.map(v => ({ value: v }));

    const chartData = xPositions.map((x, i) => ({ x, y: noteData[i] ?? 0 }));

    this.chart = new Chart(ctx, {
      type: 'line',
      options: {
        maintainAspectRatio: false,
        animations: {
          x: {
            duration: 0,
          },
          y: {
            duration: 500,
            easing: 'easeOutQuart',
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: tooltipItems => {
                const x = tooltipItems[0]?.parsed?.x;
                const label = x ? noteLabelMap.get(x) : undefined;
                return label ?? String(x);
              },
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: this.max() || 1,
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          x: {
            type: 'linear',
            min: 0,
            max: totalWidth,
            afterBuildTicks: (scale: { ticks: { value: number }[] }) => {
              const all = new Map<number, { value: number }>();
              boundaryTicks.forEach(t => all.set(t.value, t));
              noteTicks.forEach(t => all.set(t.value, t));
              scale.ticks = Array.from(all.values()).sort((a, b) => a.value - b.value);
            },
            ticks: {
              autoSkip: false,
              maxRotation: 90,
              minRotation: 45,
              color: textColor,
              callback: (value: number | string) => {
                return noteLabelMap.get(value as number) ?? '';
              },
            },
            grid: {
              color: gridColor,
            },
          },
        },
      },
      data: {
        datasets: [
          {
            data: chartData,
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

    // Read plot area dimensions so the keyboard can align with the chart's x-axis
    const area = this.chart.chartArea;
    if (area) {
      this.chartPlotLeft.set(area.left);
      this.chartPlotRight.set(this.chart.width - area.right);
    }
  }
}
