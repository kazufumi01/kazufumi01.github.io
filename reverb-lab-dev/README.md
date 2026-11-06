# Reverb Lab — Development

**Status: Development / Prototype v0.1**

A browser-based prototype for impulse-response analysis and algorithmic reverb learning.

## Open the app

https://kazufumi01.github.io/reverb-lab-dev/

## Current features

- Load an impulse response audio file locally in the browser
- Waveform display
- Schroeder energy decay curve (EDC)
- Approximate EDT and T20 estimates
- Simple Schroeder-style algorithmic reverb generation
- Pre-delay, decay, diffusion and HF damping controls
- Reference / algorithmic reverb audition and A/B comparison

## Limitations

This is an early learning prototype, not a measurement-grade analyzer or a finished reverb. The current decay estimates use a simplified regression approach. The algorithmic section is a simplified Schroeder-style model, not a full Moorer or FDN implementation. Stereo analysis, frequency-dependent decay, robust noise-floor handling, automatic matching and structured ear-training exercises are not implemented yet.

Audio files are processed locally in the browser and are not uploaded by the app.

## Development direction

1. Improve IR analysis and measurement reliability
2. Add stereo and frequency-dependent decay analysis
3. Improve algorithmic reverb models (Schroeder / Moorer / FDN)
4. Add controlled A/B matching and ear-training exercises
5. Keep the DSP core portable for a future JUCE plugin

This project is an independent development area within the GitHub Pages site.