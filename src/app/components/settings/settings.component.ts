import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {Note, Pitch, PitchData, noteToString, stringToNote} from '../constantq/Pitch';
import ConstantQ from '../constantq/ConstantQ';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  constructor() { }

  
  @Output() onMinPitch = new EventEmitter<Pitch>();
  @Output() onMaxPitch = new EventEmitter<Pitch>();
  @Output() onFps = new EventEmitter<number>();
  
  _minpitch: Pitch = ConstantQ.DEFAULT_MIN_FREQ;
  _maxpitch: Pitch = ConstantQ.DEFAULT_MAX_FREQ;

  get minpitch() {
    return this.getId(this._minpitch);
  }

  set minpitch(id) {
    this._minpitch = this.pitchFromId(id);
    this.onMinPitch.emit(this._minpitch);
  }

  get maxpitch() {
    return this.getId(this._maxpitch);
  }

  set maxpitch(id) {
    this._maxpitch = this.pitchFromId(id);
    this.onMaxPitch.emit(this._maxpitch);
  }

  get minpitches() {
    return PitchData.filter((p) => p.note === Note.C && p.frequency < this._maxpitch.frequency);
  }

  get maxpitches() {
    return PitchData.filter((p) => p.note === Note.C && p.frequency > this._minpitch.frequency);
  }

  pitchFromId(id: string) {
    return PitchData.find(p => this.getId(p) == id);
  }

  getId(pitch: Pitch) {
    return noteToString(pitch.note) + pitch.octave.toString();
  }

  getName(pitch: Pitch) {
    return this.getId(pitch);
  }


  fps: number = ConstantQ.DEFAULT_FPS;


  onFpsKey(event) {
    let val = (event && event.target && event.target.value) ? event.target.value : 1; 
    this.fps = Math.min(32, Math.max(1, Math.floor(val)));
    console.log(this.fps);
    this.onFps.emit(this.fps);
  }

  ngOnInit() {}
}
