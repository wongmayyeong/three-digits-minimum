'use client';

/**
 * Playback engine. One active segment at a time; the clock is the audio element's
 * currentTime when stored audio plays, the browser speech boundary position for device
 * voice, or a requestAnimationFrame clock in caption-only mode. Every visual cue reads the
 * same clock, and pausing stops the mouth immediately.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TurnView } from '@/lib/debate/view';
import { VOICES } from '@/lib/audio/voices';
import { beatSpans, charAt, claimAt, estimateDuration, mouthFor, phraseAt, phrases, timeAtChar, type MouthShape } from '@/lib/playback/timeline';

export type SoundMode = 'off' | 'on';
export type ClockKind = 'audio' | 'device' | 'captions';

export interface Segment {
  key: string;
  kind: 'intro' | 'turn';
  turn: TurnView | null;
}

export const INTRO_SECONDS = 6;

export function usePlayback(segments: Segment[], opts: { waitingForMore: boolean; reducedMotion: boolean }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sound, setSound] = useState<SoundMode>('off');
  const [deviceChar, setDeviceChar] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The audio element lives outside React's tree; it is created once on the client.
  useEffect(() => {
    const a = new Audio();
    a.preload = 'auto';
    audioRef.current = a;
    return () => { a.pause(); a.removeAttribute('src'); audioRef.current = null; };
  }, []);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const timeRef = useRef(0);

  const seg = segments[index] ?? null;
  const turn = seg?.turn ?? null;
  const text = turn?.speechText ?? '';
  const hasDeviceVoice = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const clock: ClockKind = !turn || sound === 'off' ? 'captions' : turn.audio ? 'audio' : hasDeviceVoice ? 'device' : 'captions';
  const alignment = clock === 'audio' && turn?.audio?.alignment?.starts?.length ? turn.audio.alignment : null;
  const duration = seg?.kind === 'intro' ? INTRO_SECONDS : clock === 'audio' && turn?.audio ? turn.audio.durationSec : estimateDuration(text);

  const derived = useMemo(() => ({ phrases: phrases(text), spans: turn ? beatSpans(turn.beats) : [] }), [text, turn]);

  const charIdx = clock === 'device' && deviceChar !== null ? deviceChar : charAt(time, duration, text.length, alignment);
  const phrase = phraseAt(derived.phrases, charIdx);
  const claimId = claimAt(derived.spans, charIdx);
  const ended = time >= duration - 0.05;
  const speaking = playing && !!turn && !ended;
  const mouth: MouthShape = speaking ? mouthFor(text[charIdx]) : 'closed';

  const stopDevice = useCallback(() => {
    if (hasDeviceVoice) window.speechSynthesis.cancel();
  }, [hasDeviceVoice]);

  // ---------------------------------------------------------------- segment switching
  const go = useCallback((i: number, autoplay = true) => {
    stopDevice();
    audioRef.current?.pause();
    timeRef.current = 0;
    setTime(0);
    setDeviceChar(null);
    setAudioError(null);
    setIndex(Math.max(0, Math.min(segments.length - 1, i)));
    setPlaying(autoplay);
  }, [segments.length, stopDevice]);

  // ---------------------------------------------------------------- captions clock
  useEffect(() => {
    if (!playing || clock !== 'captions') return;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      timeRef.current = Math.min(duration, timeRef.current + dt * speed);
      setTime(timeRef.current);
      if (timeRef.current < duration) raf.current = requestAnimationFrame(tick);
    };
    last.current = null;
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing, clock, duration, speed, index]);

  // ---------------------------------------------------------------- stored audio clock
  useEffect(() => {
    const a = audioRef.current;
    if (!a || clock !== 'audio' || !turn?.audio) return;
    if (a.dataset.src !== turn.audio.url) {
      a.src = turn.audio.url;
      a.dataset.src = turn.audio.url;
      a.currentTime = timeRef.current;
    }
    a.playbackRate = speed;
    if (playing) {
      a.play().catch((e: Error) => { setPlaying(false); setAudioError(e.name === 'NotAllowedError' ? 'Your browser blocked playback. Press play to start audio.' : 'Audio could not play. Captions continue.'); });
    } else a.pause();
    let frame = 0;
    const tick = () => {
      timeRef.current = a.currentTime;
      setTime(a.currentTime);
      if (!a.paused) frame = requestAnimationFrame(tick);
    };
    const onPlay = () => { frame = requestAnimationFrame(tick); };
    const onEnded = () => { timeRef.current = duration; setTime(duration); };
    const onError = () => setAudioError('Stored audio failed to load. Showing captions instead.');
    a.addEventListener('play', onPlay);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    if (!a.paused) onPlay();
    return () => { cancelAnimationFrame(frame); a.removeEventListener('play', onPlay); a.removeEventListener('ended', onEnded); a.removeEventListener('error', onError); };
  }, [clock, turn, playing, speed, duration, index]);

  // ---------------------------------------------------------------- device (browser) voice clock
  useEffect(() => {
    if (clock !== 'device' || !turn || !hasDeviceVoice) return;
    const synth = window.speechSynthesis;
    if (!playing) { if (synth.speaking) synth.pause(); return; }
    if (synth.paused && synth.speaking) { synth.resume(); return; }
    const from = charAt(timeRef.current, duration, text.length, null);
    const startAt = Math.max(0, text.lastIndexOf(' ', from) + 1);
    const u = new SpeechSynthesisUtterance(text.slice(startAt));
    const v = VOICES[turn.actor];
    u.rate = v.browser.rate * speed;
    u.pitch = v.browser.pitch;
    u.lang = 'en-US';
    u.onboundary = (e) => {
      const idx = startAt + e.charIndex;
      setDeviceChar(idx);
      timeRef.current = timeAtChar(idx, duration, text.length, null);
      setTime(timeRef.current);
    };
    u.onend = () => { timeRef.current = duration; setTime(duration); setDeviceChar(null); };
    synth.cancel();
    synth.speak(u);
    return () => { /* cancelled by go()/seek()/pause paths */ };
  }, [clock, turn, playing, speed, duration, text, hasDeviceVoice, index]);

  // ---------------------------------------------------------------- auto-advance
  useEffect(() => {
    if (!playing || !ended) return;
    if (index < segments.length - 1) {
      const t = setTimeout(() => go(index + 1, true), opts.reducedMotion ? 150 : 650);
      return () => clearTimeout(t);
    }
    if (!opts.waitingForMore) {
      const t = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(t);
    }
  }, [playing, ended, index, segments.length, go, opts.waitingForMore, opts.reducedMotion]);

  // When the next turn arrives while we were waiting at the end, continue.
  const prevLen = useRef(segments.length);
  useEffect(() => {
    if (segments.length > prevLen.current && playing && ended && index === prevLen.current - 1) go(index + 1, true);
    prevLen.current = segments.length;
  }, [segments.length, playing, ended, index, go]);

  useEffect(() => () => stopDevice(), [stopDevice]);

  const seek = useCallback((t: number) => {
    const clamped = Math.max(0, Math.min(duration, t));
    timeRef.current = clamped;
    setTime(clamped);
    setDeviceChar(null);
    if (clock === 'audio' && audioRef.current) audioRef.current.currentTime = clamped;
    if (clock === 'device') { stopDevice(); if (playing) { setPlaying(false); setTimeout(() => setPlaying(true), 30); } }
  }, [duration, clock, stopDevice, playing]);

  const toggle = useCallback(() => {
    if (!seg) return;
    if (ended && !playing) { seek(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  }, [seg, ended, playing, seek]);

  const setSoundMode = useCallback((m: SoundMode) => {
    stopDevice();
    audioRef.current?.pause();
    setSound(m);
  }, [stopDevice]);

  return {
    index, seg, turn, playing, time, duration, speed, sound, clock, charIdx, phrase, claimId, mouth, speaking, ended, audioError,
    go, seek, toggle, setSpeed, setSound: setSoundMode, setPlaying, alignmentKind: turn?.audio?.alignmentKind ?? null,
  };
}
