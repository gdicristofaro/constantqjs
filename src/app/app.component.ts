import { PercentPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogContent } from '@angular/material/dialog';
import { AudioLoadingModalComponent } from './components/audio-loading-modal/audio-loading-modal.component';
import {
  AudioSelectionAndSettings,
  AudioSelectionModalComponent,
} from './components/audio-selection-modal/audio-selection-modal.component';
import { AudioPlayerComponent } from './components/audioplayer/audioplayer.component';
import { AudioVisualizerComponent } from './components/audiovisualizer/audiovisualizer.component';
import { FileInfoBarComponent } from './components/file-info-bar/file-info-bar.component';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { AudioLoadService } from './services/audio-load.service';
import { AudioPlaybackService } from './services/audio-playback.service';
import { ConstantqService } from './services/constantq.service';

@Component({
  selector: 'cq-app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    MatDialogContent,
    AudioPlayerComponent,
    PercentPipe,
    AudioVisualizerComponent,
    AudioSelectionModalComponent,
    AudioLoadingModalComponent,
    FileInfoBarComponent,
    LoadingIndicatorComponent,
  ],
})
export class AppComponent {
  protected readonly audioLoadSvc = inject(AudioLoadService);
  private readonly audioPlaybackSvc = inject(AudioPlaybackService);
  protected readonly constantQSvc = inject(ConstantqService);

  private readonly http = inject(HttpClient);
  private readonly modalService = inject(MatDialog);

  modalOpen = signal(true);

  // whether or not audio is loading
  loadingMessage = signal<string>('');
  loadingPercentage = signal<number>(0);

  /**
   * whether or not to show controls
   */
  showControls = computed(() => {
    return this.audioPlaybackSvc.hasSource();
  });

  handleUploadRequest(selectionAndSettings: AudioSelectionAndSettings) {
    this.modalOpen.set(false);
    this.audioLoadSvc.loadAudioFile(selectionAndSettings.audioFile, selectionAndSettings.settings);
  }
}

// /* ── STATE ── */
//   const state = {
//     isPlaying:     false,
//     currentTime:   0,
//     duration:      0,
//     processedTime: 0,
//     dragging:      false,
//     fileLoaded:    false,
//   };

//   /* ── DOM REFS ── */
//   const el = {
//     modalLoading:  document.getElementById('modal-loading'),
//     modalFilename: document.getElementById('modal-loading-filename'),
//     modalBar:      document.getElementById('modal-loading-bar'),
//     fileInfoBar:   document.getElementById('file-info-bar'),
//     fileInfoName:  document.getElementById('file-info-name'),
//     fileInfoDur:   document.getElementById('file-info-dur'),
//     fileInfoSr:    document.getElementById('file-info-sr'),
//     chartEmpty:    document.getElementById('chart-empty'),
//     cqChart:       document.getElementById('cq-chart'),
//     transportBar:  document.getElementById('transport-bar'),
//     barProcessed:  document.getElementById('bar-processed'),
//     barPlayed:     document.getElementById('bar-played'),
//     barTick:       document.getElementById('bar-tick'),
//     barThumb:      document.getElementById('bar-thumb'),
//     timeCurrent:   document.getElementById('time-current'),
//     timeTotal:     document.getElementById('time-total'),
//     processedPct:  document.getElementById('processed-pct'),
//     badgeLabel:    document.getElementById('badge-label'),
//     iconPlay:      document.getElementById('icon-play'),
//     iconPause:     document.getElementById('icon-pause'),
//   };

//   /* ── HELPERS ── */
//   function formatTime(secs) {
//     const m  = Math.floor(secs / 60);
//     const s  = Math.floor(secs % 60).toString().padStart(2, '0');
//     const ms = Math.floor((secs % 1) * 10);
//     return `${m}:${s}.${ms}`;
//   }
//   function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

//   function updateBarUI() {
//     const dur = state.duration || 1;
//     const playPct    = clamp(state.currentTime   / dur, 0, 1) * 100;
//     const processPct = clamp(state.processedTime / dur, 0, 1) * 100;

//     el.barPlayed.style.width    = `${playPct}%`;
//     el.barThumb.style.left      = `${playPct}%`;
//     el.barProcessed.style.width = `${processPct}%`;
//     el.barTick.style.left       = `${processPct}%`;

//     el.timeCurrent.textContent  = formatTime(state.currentTime);
//     el.timeTotal.textContent    = formatTime(state.duration);
//     el.processedPct.textContent = `${Math.round(processPct)}%`;
//   }

//   function setStatus(mode) {
//     const base = 'inline-block px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase';
//     const variants = {
//       idle:       `${base} bg-slate-100 border border-slate-200 text-slate-400`,
//       processing: `${base} bg-process-light border border-process/40 text-process`,
//       ready:      `${base} bg-accent-light border border-accent-mid text-accent`,
//     };
//     el.badgeLabel.className   = variants[mode] || variants.idle;
//     el.badgeLabel.textContent = mode.toUpperCase();
//   }

//   /* ── LOADING MODAL ── */
//   /** Show the loading modal. Call before you start decoding. */
//   function showLoadingModal(filename) {
//     el.modalFilename.textContent = filename || '';
//     el.modalBar.style.width = '0%';
//     el.modalLoading.classList.remove('hidden');
//   }

//   /** Update the loading bar (0–1). */
//   function setLoadingProgress(fraction) {
//     el.modalBar.style.width = `${clamp(fraction, 0, 1) * 100}%`;
//   }

//   /* ── PROCESSED TIME ── */
//   /** Tell the UI how far background processing has reached (seconds). */
//   function setProcessedTime(seconds) {
//     state.processedTime = clamp(seconds, 0, state.duration);
//     setStatus(state.processedTime >= state.duration ? 'ready' : 'processing');
//     if (!state.isPlaying) updateBarUI();
//   }

//   /* ── PLAYBACK ── */
//   /** Call this from your Web Audio time-update loop. */
//   function setCurrentTime(seconds) {
//     state.currentTime = clamp(seconds, 0, state.duration);
//     updateBarUI();
//     if (state.currentTime >= state.duration) _setPlaying(false);
//   }

//   function _setPlaying(playing) {
//     state.isPlaying = playing;
//     el.iconPlay.classList.toggle('hidden',  playing);
//     el.iconPause.classList.toggle('hidden', !playing);
//   }

//   function onPlayPause() {
//     if (!state.fileLoaded) return;
//     _setPlaying(!state.isPlaying);
//     // ── Hook: wire to your Web Audio engine here ──
//     console.log(state.isPlaying ? 'PLAY' : 'PAUSE', 'at', state.currentTime, 's');
//   }

//   function onRewind() {
//     state.currentTime = 0;
//     _setPlaying(false);
//     updateBarUI();
//     // ── Hook: seek your audio source to 0 ──
//     console.log('REWIND');
//   }

//   /* ── SCRUB BAR ── */
//   function _barFraction(clientX) {
//     const rect = el.transportBar.getBoundingClientRect();
//     return clamp((clientX - rect.left) / rect.width, 0, 1);
//   }

//   function onBarMouseDown(e) {
//     if (!state.fileLoaded) return;
//     state.dragging = true;
//     setCurrentTime(_barFraction(e.clientX) * state.duration);
//     window.addEventListener('mousemove', _onBarMouseMove);
//     window.addEventListener('mouseup',   _onBarMouseUp);
//   }
//   function _onBarMouseMove(e) { if (state.dragging) setCurrentTime(_barFraction(e.clientX) * state.duration); }
//   function _onBarMouseUp() {
//     state.dragging = false;
//     window.removeEventListener('mousemove', _onBarMouseMove);
//     window.removeEventListener('mouseup',   _onBarMouseUp);
//     // ── Hook: seek audio engine to state.currentTime ──
//     console.log('SEEK to', state.currentTime, 's');
//   }

//   function onBarTouchStart(e) {
//     if (!state.fileLoaded) return;
//     setCurrentTime(_barFraction(e.touches[0].clientX) * state.duration);
//     window.addEventListener('touchmove', _onBarTouchMove, { passive: true });
//     window.addEventListener('touchend',  _onBarTouchEnd);
//   }
//   function _onBarTouchMove(e) { setCurrentTime(_barFraction(e.touches[0].clientX) * state.duration); }
//   function _onBarTouchEnd() {
//     window.removeEventListener('touchmove', _onBarTouchMove);
//     window.removeEventListener('touchend',  _onBarTouchEnd);
//     console.log('SEEK to', state.currentTime, 's');
//   }

//   /* ── FILE LOAD BUTTON ── */
//   function onLoadFileClick() {
//     // ── Replace with your existing modal dialog trigger ──
//     console.log('Open file picker modal');
//     _demoLoad(); // remove when wiring real audio
//   }

//   /* ── DEMO SIMULATION (remove when wiring real audio) ── */
//   function _demoLoad() {
//     const demoFile = 'example_audio.wav';
//     showLoadingModal(demoFile);
//     let prog = 0;
//     const iv = setInterval(() => {
//       prog += 0.08 + Math.random() * 0.06;
//       setLoadingProgress(prog);
//       if (prog >= 1) {
//         clearInterval(iv);
//         setTimeout(() => {
//           onAudioLoaded({ filename: demoFile, duration: 183.4, sampleRate: 44100 });
//           _demoProcessing();
//         }, 300);
//       }
//     }, 120);
//   }
//   function _demoProcessing() {
//     let t = 0;
//     const iv = setInterval(() => {
//       t += 2.4 + Math.random() * 1.2;
//       setProcessedTime(t);
//       if (t >= 183.4) clearInterval(iv);
//     }, 200);
//   }

//   /* ── PLOTLY CHART ── */
//   /**
//    * Initialise (or replace) the Plotly chart.
//    * Call once after audio is loaded; use Plotly.restyle / extendTraces to add data incrementally.
//    *
//    * @param {object[]} plotlyData   - Plotly data array
//    * @param {object}   plotlyLayout - Plotly layout overrides
//    */
//   function initChart(plotlyData, plotlyLayout) {
//     Plotly.react(el.cqChart, plotlyData || [], {
//       paper_bgcolor: 'rgba(0,0,0,0)',
//       plot_bgcolor:  'rgba(0,0,0,0)',
//       font:   { family: 'JetBrains Mono', color: '#64748b', size: 10 },
//       margin: { l: 52, r: 16, t: 12, b: 44 },
//       xaxis: {
//         title: { text: 'Time (s)', standoff: 8 },
//         gridcolor: '#f1f5f9', linecolor: '#e2e8f0', tickcolor: '#e2e8f0', zerolinecolor: '#e2e8f0',
//       },
//       yaxis: {
//         title: { text: 'Frequency (Hz)' },
//         gridcolor: '#f1f5f9', linecolor: '#e2e8f0', tickcolor: '#e2e8f0', zerolinecolor: '#e2e8f0',
//         type: 'log',
//       },
//       coloraxis: {
//         colorscale: [
//           [0,    '#eff6ff'],
//           [0.25, '#bfdbfe'],
//           [0.5,  '#3b82f6'],
//           [0.75, '#1d4ed8'],
//           [1,    '#172554'],
//         ],
//         colorbar: {
//           thickness: 10,
//           tickfont:     { size: 9, color: '#94a3b8' },
//           tickcolor:    '#e2e8f0',
//           outlinecolor: '#e2e8f0',
//         },
//       },
//       ...plotlyLayout,
//     }, { responsive: true, displayModeBar: false });
//   }

//   /* ── INIT ── */
//   updateBarUI();

//   /* ── EXPORTS ── */
//   window.CQ = { showLoadingModal, setLoadingProgress, onAudioLoaded, setProcessedTime, setCurrentTime, initChart };
