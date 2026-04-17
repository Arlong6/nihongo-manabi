#!/usr/bin/env python3
"""Generate a cheerful lo-fi style BGM using numpy synthesis.

Output: public/music/bgm.mp3 (60s, looping-friendly)
Style: ukulele-like plucks + soft hi-hat + warm bass + lo-fi vinyl crackle
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np

SR = 44100
DURATION = 60
BPM = 95
BEAT = 60 / BPM
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "music" / "bgm.mp3"


def note_freq(name: str) -> float:
    notes = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    n = name[0]
    sharp = "#" in name
    octave = int(name[-1])
    midi = 12 * (octave + 1) + notes[n] + (1 if sharp else 0)
    return 440 * 2 ** ((midi - 69) / 12)


def pluck(freq: float, dur: float, vol: float = 0.35) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    decay = np.exp(-t * 6)
    harmonics = (
        np.sin(2 * np.pi * freq * t) * 0.6
        + np.sin(2 * np.pi * freq * 2 * t) * 0.25
        + np.sin(2 * np.pi * freq * 3 * t) * 0.1
        + np.sin(2 * np.pi * freq * 4 * t) * 0.05
    )
    return harmonics * decay * vol


def soft_pad(freq: float, dur: float, vol: float = 0.12) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    attack = np.minimum(t / 0.3, 1.0)
    release_start = dur - 0.3
    release = np.where(t > release_start, 1 - (t - release_start) / 0.3, 1.0)
    env = attack * release
    wave = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    return wave * env * vol


def hihat(dur: float = 0.06, vol: float = 0.08) -> np.ndarray:
    n = int(SR * dur)
    noise = np.random.randn(n)
    decay = np.exp(-np.linspace(0, 12, n))
    from scipy.signal import butter, lfilter
    b, a = butter(2, [6000 / (SR / 2), 12000 / (SR / 2)], btype="band")
    filtered = lfilter(b, a, noise)
    return filtered * decay * vol


def kick(dur: float = 0.15, vol: float = 0.25) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    freq_sweep = 150 * np.exp(-t * 20) + 45
    phase = np.cumsum(freq_sweep) / SR * 2 * np.pi
    decay = np.exp(-t * 12)
    return np.sin(phase) * decay * vol


def vinyl_crackle(dur: float, vol: float = 0.015) -> np.ndarray:
    n = int(SR * dur)
    crackle = np.random.randn(n) * vol
    mask = np.random.random(n) > 0.997
    crackle *= mask.astype(float)
    return crackle


def lowpass(signal: np.ndarray, cutoff: float = 3000) -> np.ndarray:
    from scipy.signal import butter, lfilter
    b, a = butter(2, cutoff / (SR / 2), btype="low")
    return lfilter(b, a, signal)


def mix_at(target: np.ndarray, source: np.ndarray, offset: int) -> None:
    end = min(offset + len(source), len(target))
    target[offset : end] += source[: end - offset]


def main():
    try:
        from scipy.signal import butter  # noqa: F401
    except ImportError:
        print("scipy not found, installing...")
        subprocess.run(["pip", "install", "scipy"], check=True)

    total_samples = SR * DURATION
    track = np.zeros(total_samples)

    # Chord progression: C - Am - F - G (happy / nostalgic)
    progression = [
        (["C4", "E4", "G4"], ["C3"]),      # C major
        (["A3", "C4", "E4"], ["A2"]),       # A minor
        (["F3", "A3", "C4"], ["F2"]),       # F major
        (["G3", "B3", "D4"], ["G2"]),       # G major
    ]

    bar_dur = BEAT * 4  # 4 beats per bar
    beats_total = int(DURATION / BEAT)

    for beat_i in range(beats_total):
        t_offset = int(beat_i * BEAT * SR)
        bar_i = (beat_i // 4) % len(progression)
        chord_notes, bass_notes = progression[bar_i]
        beat_in_bar = beat_i % 4

        # Pluck chords on beats 1, 2.5, 4
        if beat_in_bar in (0, 2, 3):
            for note in chord_notes:
                mix_at(track, pluck(note_freq(note), BEAT * 1.5, vol=0.20), t_offset)

        # Strum pattern: extra pluck on off-beat
        if beat_in_bar == 1:
            half_beat = int(BEAT * 0.5 * SR)
            for note in chord_notes:
                mix_at(track, pluck(note_freq(note), BEAT, vol=0.12), t_offset + half_beat)

        # Bass on beat 1 and 3
        if beat_in_bar in (0, 2):
            for note in bass_notes:
                mix_at(track, soft_pad(note_freq(note), BEAT * 2, vol=0.18), t_offset)

        # Hi-hat on every beat + off-beats
        mix_at(track, hihat(vol=0.06), t_offset)
        mix_at(track, hihat(vol=0.03), t_offset + int(BEAT * 0.5 * SR))

        # Soft kick on 1 and 3
        if beat_in_bar in (0, 2):
            mix_at(track, kick(vol=0.18), t_offset)

    # Add vinyl crackle
    track += vinyl_crackle(DURATION, vol=0.012)

    # Lo-fi warmth: lowpass filter
    track = lowpass(track, cutoff=4500)

    # Fade in/out
    fade_samples = int(SR * 2)
    track[:fade_samples] *= np.linspace(0, 1, fade_samples)
    track[-fade_samples:] *= np.linspace(1, 0, fade_samples)

    # Normalize
    peak = np.max(np.abs(track))
    if peak > 0:
        track = track / peak * 0.85

    # Write wav then convert to mp3
    track_16 = (track * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        import wave
        w = wave.open(f.name, "w")
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(track_16.tobytes())
        w.close()
        OUT.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-i", f.name, "-b:a", "192k", str(OUT)], capture_output=True, check=True)

    print(f"✓ {OUT} ({DURATION}s, {BPM} BPM)")


if __name__ == "__main__":
    main()
