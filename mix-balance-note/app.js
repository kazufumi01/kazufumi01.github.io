/* Mix Balance Study Note — Web Audio 4-Stem Mixer, Console Color & 3-Way Meter Bridge */
(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'ja').toLowerCase().startsWith('en') ? 'en' : 'ja';
  var JA = LANG === 'ja';

  var STEMS = ['Kick', 'Bass', 'Snare', 'Vocal'];
  var METRICS = [
    { id: 'lufs', label: 'LUFS-M', unit: 'LUFS', target: -16.0 },
    { id: 'vu',   label: 'VU',     unit: 'VU',   target: 0.0 },
    { id: 'rms',  label: 'RMS',    unit: 'dBFS', target: -16.0 },
    { id: 'peak', label: 'Peak',   unit: 'dBFS', target: -8.0 }
  ];

  var CONSOLES = [
    { id: 'auto', name: 'Auto' },
    { id: 'lab',  name: 'Lab Reference' },
    { id: '4k',   name: '4K Solid-State' },
    { id: '73',   name: '73 Class-A' },
    { id: 'us',   name: 'US Discrete' }
  ];

  var GENRES = [
    { id: 'flat',      name: 'Flat',       delta: [0, 0, 0, 0],        desk: 1,
      ja: '全フェーダー 0 dB で、4トラックを同じ音量（−16 LUFS-M / 0 VU）に揃える基礎練習です。',
      en: 'Keep all Main Faders at 0 dB and match all 4 tracks to −16 LUFS-M / 0 VU using Input Gain.' },
    { id: 'jpop',      name: 'J-Pop',      delta: [0, -1.5, 0.5, 3.0], desk: 2,
      ja: '歌を +3.0 dB 前に出し、Bass を −1.5 dB 引いて歌詞とメロディの空間を空けます。',
      en: 'Pushes Vocal +3.0 dB forward while trimming Bass (−1.5 dB) to keep lyrics clear.' },
    { id: 'kpop',      name: 'K-Pop',      delta: [0, -0.5, 0.5, 1.5], desk: 2,
      ja: 'J-Pop よりリズム隊の比重が高く、タイトな低域と Vocal (+1.5 dB) が同じ熱量で前に出ます。',
      en: 'Heavier Kick & Bass weight than J-Pop so low-end groove and Vocal (+1.5 dB) hit together.' },
    { id: 'rnb',       name: 'R&B',        delta: [0, 0.5, -1.5, 2.0], desk: 3,
      ja: 'Snare を −1.5 dB 奥に引き、Bass (+0.5) と Vocal (+2.0) で深いポケットを作ります。',
      en: 'Tucks Snare back (−1.5 dB) while warm Bass (+0.5) and Vocal (+2.0) carry the pocket.' },
    { id: 'edm',       name: 'EDM',        delta: [0, -0.5, -1.0, -1.0], desk: 2,
      ja: 'Kick (0.0) と Bass (−0.5) を主役にし、Snare と Vocal/Lead はリズムの壁に収めます。',
      en: 'Kick (0.0) and Bass (−0.5) dominate while Snare and Lead (−1.0) sit inside the rhythm wall.' },
    { id: 'hiphop',    name: 'Hip-Hop',    delta: [0, -0.5, -1.0, 1.0], desk: 2,
      ja: 'Kick と Bass の太い土台の上に Vocal (+1.0) を乗せ、Snare (−1.0) はアタックで抜きます。',
      en: 'Anchor Kick & Bass, place Vocal at +1.0 dB, and let crisp Snare transients cut at −1.0 dB.' },
    { id: 'rock',      name: 'Rock',       delta: [0, -1.0, 1.5, 1.0], desk: 3,
      ja: '2・4拍の Snare (+1.5 dB) を押し出し、Vocal (+1.0 dB) と拮抗する推進力を作ります。',
      en: 'Drives backbeat Snare (+1.5 dB) to lock with Vocal (+1.0 dB) over Bass (−1.0 dB).' },
    { id: 'indiepop',  name: 'Indie Pop',  delta: [0, -0.5, 0.0, 1.5], desk: 4,
      ja: 'J-Pop ほど歌を離さず、伴奏のすぐ近くに Vocal (+1.5 dB) を置いて親密に馴染ませます。',
      en: 'Vocal (+1.5 dB) sits close to the instruments rather than floating far in front.' },
    { id: 'indierock', name: 'Indie Rock', delta: [0, 0.0, 1.0, -0.5], desk: 4,
      ja: 'Snare (+1.0 dB) を立て、あえて Vocal を −0.5 dB 沈めてバンドの塊感を作ります。',
      en: 'Pushes Snare (+1.0 dB) and tucks Vocal (−0.5 dB) inside the raw band wall.' }
  ];

  var LESSONS = [
    { badge: 'LESSON 01 / 06', stage: 0, metric: 3, genre: 0, varIdx: 0,
      titleJa: 'Peak で 4 トラックを −8 dBFS に揃える',
      titleEn: 'Match all 4 tracks to −8 dBFS Peak',
      bodyJa: 'Peak 基準で全トラックを −8.0 dBFS に揃えると、アタックの鋭い Snare だけが小さく聴こえ、持続音の Bass/Vocal が大きく聴こえます。',
      bodyEn: 'Matching Sample Peak to −8.0 dBFS makes sharp Snare sound quiet while sustained Bass & Vocal sound loud.' },
    { badge: 'LESSON 02 / 06', stage: 0, metric: 1, genre: 0, varIdx: 0,
      titleJa: 'VU (0 VU) で揃え、Crest の差を見る',
      titleEn: 'Match at 0 VU and compare Crest Factor',
      bodyJa: 'VU メーターで 0 VU に揃えると聴感はかなり近づきます。右下の Crest Matrix で、同じ VU でも Snare の Peak（赤）だけが高く飛び出す様子を確認しましょう。',
      bodyEn: 'At 0 VU loudness feels closer, yet Crest Matrix shows Snare Peak (red) jumping much higher than RMS.' },
    { badge: 'LESSON 03 / 06', stage: 0, metric: 0, genre: 0, varIdx: 0,
      titleJa: 'LUFS-M で −16 LUFS にゲインステージング',
      titleEn: 'Gain-stage to −16.0 LUFS-M (and Blind ear training)',
      bodyJa: 'LUFS-M で全4トラックを −16.0 LUFS に揃えます。これで「Fader 0 dB ＝ 全パート同ラウドネス」の土台が完成。Blind を ON にして耳トレも試せます。',
      bodyEn: 'Match all 4 tracks to −16.0 LUFS-M so Fader 0 dB equals matched loudness. Try Blind mode for ear training.' },
    { badge: 'LESSON 04 / 06', stage: 1, metric: 0, genre: 1, varIdx: 1,
      titleJa: 'J-Pop vs K-Pop：歌と低域の距離感を A/B 比較',
      titleEn: 'J-Pop vs K-Pop: Vocal & low-end balance A/B',
      bodyJa: 'STEP 2 に切り替え、J-Pop（Vocal +3.0 / Bass −1.5）と K-Pop（Vocal +1.5 / Bass −0.5）を Snapshot A / B に保存して「音量揃えて比較」で聴き比べます。',
      bodyEn: 'In STEP 2, save J-Pop and K-Pop to Snapshots A & B and A/B with Loudness Match ON.' },
    { badge: 'LESSON 05 / 06', stage: 1, metric: 0, genre: 3, varIdx: 2,
      titleJa: 'R&B と 73 Class-A：低域の重心と温かみ',
      titleEn: 'R&B & 73 Class-A: Deep pocket & analog color',
      bodyJa: 'R&B（Bass +0.5 / Snare −1.5 / Vocal +2.0）でスネアを奥に引き、COLOR を ON にして 73 Class-A 卓の丸みと倍音を体感します。',
      bodyEn: 'With R&B (Snare −1.5, Bass +0.5), toggle COLOR ON to audition subtle 73 Class-A warmth.' },
    { badge: 'LESSON 06 / 06', stage: 1, metric: 0, genre: 8, varIdx: 3,
      titleJa: 'Indie Rock：あえてボーカルを −0.5 dB 沈める',
      titleEn: 'Indie Rock: Tucking Vocal at −0.5 dB',
      bodyJa: 'Rock（Snare +1.5）や Indie Rock（Snare +1.0 / Vocal −0.5）を試し、ボーカルを伴奏の中に馴染ませるバンドバランスを聴き比べます。',
      bodyEn: 'Compare Rock and Indie Rock to hear how tucking Vocal (−0.5 dB) glues it into the band.' }
  ];

  var VARIATIONS = [
    { name: 'Pop 96 (96 BPM)',     bpm: 96 },
    { name: 'Dance 116 (116 BPM)', bpm: 116 },
    { name: 'R&B 84 (84 BPM)',     bpm: 84 },
    { name: 'Rock 124 (124 BPM)',  bpm: 124 },
    { name: 'Trap 92 (92 BPM)',    bpm: 92 }
  ];

  // State
  var state = {
    playing: false,
    varIdx: 0,
    stage: 0,       // 0: Step1 (Input Trim), 1: Step2 (Main Fader)
    metric: 0,      // 0: LUFS-M, 1: VU, 2: RMS, 3: Peak
    genre: 0,       // 0..8
    tolIdx: 1,      // 0: 1.5, 1: 0.8, 2: 0.3
    consoleChoice: 0, // 0: Auto, 1: Lab, 2: 4K, 3: 73, 4: US
    colorOn: false,
    blind: false,
    loudnessMatch: true,
    inGain: [0, 0, 0, 0],
    fader:  [0, 0, 0, 0],
    solo:   [false, false, false, false],
    mute:   [false, false, false, false],
    snapshots: [null, null, null],
    activeSnap: -1,
    judge: null
  };

  var TOLS = [1.5, 0.8, 0.3];

  // Offline stem characteristics at 0 dB (populated when buffers render; initialized with accurate defaults)
  var stemBase = [
    { lufs: -16.0, vu: 0.0, rms: -16.8, peak: -6.2 },
    { lufs: -16.0, vu: 0.0, rms: -13.6, peak: -10.8 },
    { lufs: -16.0, vu: 0.0, rms: -19.2, peak: -2.4 },
    { lufs: -16.0, vu: 0.0, rms: -16.4, peak: -8.1 }
  ];

  // Live readings per channel
  var readings = [
    { lufs: -16, vu: 0, rms: -16.8, peak: -6.2, vuNeedle: 0, vuVel: 0 },
    { lufs: -16, vu: 0, rms: -13.6, peak: -10.8, vuNeedle: 0, vuVel: 0 },
    { lufs: -16, vu: 0, rms: -19.2, peak: -2.4, vuNeedle: 0, vuVel: 0 },
    { lufs: -16, vu: 0, rms: -16.4, peak: -8.1, vuNeedle: 0, vuVel: 0 }
  ];

  // =========================================================================
  //  DSP Helpers: ITU-R BS.1770 K-Weighting & StemSynth (JS port of StemSynth.h)
  // =========================================================================
  function makeBiquad(b0, b1, b2, a1, a2) {
    return { b0: b0, b1: b1, b2: b2, a1: a1, a2: a2, z1: 0, z2: 0 };
  }
  function procBiquad(bq, x) {
    var y = bq.b0 * x + bq.z1;
    bq.z1 = bq.b1 * x - bq.a1 * y + bq.z2;
    bq.z2 = bq.b2 * x - bq.a2 * y;
    return y;
  }
  function makeKWeighting(fs) {
    var pi = Math.PI;
    var f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
    var K = Math.tan(pi * f0 / fs), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416);
    var a0 = 1 + K / Q + K * K;
    var s1 = makeBiquad((Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0);
    f0 = 38.13547087602444; Q = 0.5003270373238773;
    K = Math.tan(pi * f0 / fs); a0 = 1 + K / Q + K * K;
    var s2 = makeBiquad(1 / a0, -2 / a0, 1 / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0);
    return { s1: s1, s2: s2 };
  }
  function procKW(kw, x) { return procBiquad(kw.s2, procBiquad(kw.s1, x)); }

  function seededRand(seed) {
    var s = seed >>> 0;
    return function () {
      s = (1664525 * s + 1013904223) >>> 0;
      return (s / 4294967296) * 2 - 1;
    };
  }

  var stemBank = []; // [varIdx][stemIdx] -> { L: Float32Array, R: Float32Array, base: {...} }

  function synthesizeVariation(v, fs) {
    var bpms = [96, 116, 84, 124, 92];
    var beatS = 60 / bpms[v];
    var len = Math.max(1024, Math.round(fs * beatS * 8));
    var stems = [0, 1, 2, 3].map(function () {
      return { L: new Float32Array(len), R: new Float32Array(len) };
    });
    function add(s, start, i, l, r) {
      var idx = (start + i) % len;
      if (idx < 0) idx += len;
      stems[s].L[idx] += l;
      stems[s].R[idx] += r;
    }

    // 0: Kick
    var kPat = [
      [0, 1, 2, 2.75, 3, 4, 5, 6.5],
      [0, 1, 2, 3, 4, 5, 6, 7],
      [0, 1.5, 2, 3.75, 4, 5.5, 6, 7.5],
      [0, 1.5, 2, 2.5, 4, 5.5, 6, 7.25],
      [0, 1.75, 2.5, 4, 5.25, 6, 7.5]
    ][v];
    var fBase = [50, 54, 44, 58, 42][v];
    var fSwp  = [110, 130, 85, 95, 90][v];
    var kDec  = [0.14, 0.11, 0.22, 0.09, 0.28][v];
    var kClk  = [0.25, 0.35, 0.12, 0.42, 0.18][v];
    var kDur  = Math.floor(0.45 * fs);
    kPat.forEach(function (b) {
      var s0 = Math.round(b * beatS * fs), ph = 0;
      for (var i = 0; i < kDur; i++) {
        var t = i / fs;
        var f = fBase + fSwp * Math.exp(-t / 0.022);
        ph += 2 * Math.PI * f / fs;
        var clk = kClk * Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-t / 0.003);
        var env = Math.min(1, t / 0.0012) * Math.exp(-t / kDec);
        var val = Math.tanh(1.25 * (0.9 * Math.sin(ph) + clk)) * env;
        add(0, s0, i, val, val);
      }
    });

    // 1: Bass
    var roots = v === 4 ? [48.9994, 43.6535] : [55.0, 43.6535];
    for (var bar = 0; bar < 2; bar++) {
      var f0 = roots[bar];
      var steps = v === 1 ? 8 : 4;
      for (var st = 0; st < steps; st++) {
        var sb = v === 1 ? st * 0.5 : (st === 1 ? 1.5 : st === 2 ? 2 : st === 3 ? 3 : 0);
        var sd = v === 1 ? 0.44 : (st === 0 ? 1.42 : st === 1 ? 0.48 : 0.94);
        var mult = (v === 1 && st % 2 === 1) ? 2 : ((st === 3 && v !== 4) ? 1.5 : 1);
        var s0 = Math.round((bar * 4 + sb) * beatS * fs);
        var dur = Math.round(sd * beatS * fs);
        var f = f0 * mult, ph = 0;
        for (var i = 0; i < dur; i++) {
          var t = i / fs;
          var att = Math.min(1, t / (v === 2 ? 0.015 : 0.006));
          var rel = Math.min(1, (dur - i) / (0.015 * fs));
          ph += 2 * Math.PI * f / fs;
          var sig = v === 3
            ? Math.tanh(1.9 * (0.65 * Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.22 * Math.sin(3 * ph)))
            : (v === 2 || v === 4)
              ? Math.tanh(1.1 * (0.88 * Math.sin(ph) + 0.16 * Math.sin(2 * ph)))
              : Math.tanh(1.4 * (0.75 * Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)));
          var val = 0.55 * att * rel * sig;
          add(1, s0, i, val, val);
        }
      }
    }

    // 2: Snare & Hats
    var rnd = seededRand(404 + v * 37);
    var lpA = 1 - Math.exp(-2 * Math.PI * (v === 3 ? 5800 : 5000) / fs);
    var hpA = 1 - Math.exp(-2 * Math.PI * 620 / fs);
    for (var bar = 0; bar < 2; bar++) {
      var div = (v === 1 || v === 4) ? 16 : 8;
      for (var e = 0; e < div; e++) {
        var s0 = Math.round((bar * 4 + e * (4 / div)) * beatS * fs);
        var dur = Math.floor((v === 4 ? 0.10 : 0.20) * fs);
        var acc = e % 2 === 0 ? 0.22 : 0.13;
        var low = 0, top = 0;
        for (var i = 0; i < dur; i++) {
          var t = i / fs, nz = rnd();
          low += hpA * (nz - low);
          top += lpA * ((nz - low) - top);
          var env = Math.min(1, t / 0.002) * Math.exp(-t / (v === 4 ? 0.032 : 0.080));
          var val = acc * top * env;
          add(2, s0, i, val * 0.94, val * 1.06);
        }
      }
      [1.0, 3.0].forEach(function (beat) {
        var s0 = Math.round((bar * 4 + beat) * beatS * fs);
        var dur = Math.floor(0.40 * fs), low = 0, band = 0;
        var bodyF = v === 2 ? 310 : v === 4 ? 225 : 192;
        var bodyD = v === 2 ? 0.025 : 0.072;
        var wireD = v === 1 ? 0.085 : v === 3 ? 0.14 : 0.10;
        for (var i = 0; i < dur; i++) {
          var t = i / fs, nz = rnd();
          low += hpA * (nz - low);
          band += lpA * ((nz - low) - band);
          var wires = band * (0.75 * Math.exp(-t / wireD) + 0.25 * Math.exp(-t / 0.22));
          var body = 0.68 * Math.sin(2 * Math.PI * (bodyF + 45 * Math.exp(-t / 0.012)) * t) * Math.exp(-t / bodyD);
          var env = Math.min(1, t / 0.001);
          add(2, s0, i, 0.55 * env * Math.tanh(1.6 * (body + wires * 0.96)), 0.55 * env * Math.tanh(1.6 * (body + wires * 1.04)));
        }
      });
    }

    // 3: Vocal / Lead
    var mel = [
      [440, 493.88, 523.25, 493.88, 349.23, 392, 440, 523.25],
      [523.25, 587.33, 659.25, 523.25, 440, 523.25, 587.33, 493.88],
      [392, 440, 493.88, 440, 349.23, 392, 440, 329.63],
      [440, 440, 523.25, 587.33, 349.23, 392, 440, 392],
      [392, 466.16, 587.33, 466.16, 349.23, 440, 523.25, 440]
    ][v];
    function makeBand(f0, q) {
      var w0 = 2 * Math.PI * f0 / fs, a = Math.sin(w0) / (2 * q), a0 = 1 + a;
      return makeBiquad(a / a0, 0, -a / a0, (-2 * Math.cos(w0)) / a0, (1 - a) / a0);
    }
    var f1 = v === 2 ? 620 : v === 3 ? 1150 : 780;
    var f2 = v === 1 ? 2450 : v === 4 ? 1950 : 2150;
    var fm1L = makeBand(f1, 2.2), fm1R = makeBand(f1 + 10, 2.2);
    var fm2L = makeBand(f2, 2.6), fm2R = makeBand(f2 - 20, 2.6);
    var phL = 0, phR = 0, maxH = v === 2 ? 4 : v === 3 ? 9 : 7;
    for (var st = 0; st < 8; st++) {
      var s0 = Math.round(st * beatS * fs);
      var dur = Math.round((v === 4 ? 0.72 : 0.94) * beatS * fs);
      var bf = mel[st];
      for (var i = 0; i < dur; i++) {
        var t = i / fs;
        var vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.14);
        var f = bf * vib;
        phL += 2 * Math.PI * f * 0.999 / fs;
        phR += 2 * Math.PI * f * 1.001 / fs;
        var rL = 0, rR = 0;
        for (var h = 1; h <= maxH; h++) {
          var amp = (v === 3 && h % 2 === 1) ? (1.3 / h) : (1 / h);
          rL += amp * Math.sin(h * phL);
          rR += amp * Math.sin(h * phR);
        }
        var vL = 0.45 * rL + 1.15 * procBiquad(fm1L, rL) + 0.55 * procBiquad(fm2L, rL);
        var vR = 0.45 * rR + 1.15 * procBiquad(fm1R, rR) + 0.55 * procBiquad(fm2R, rR);
        var decE = v === 4 ? Math.exp(-t / 0.24) : (0.85 + 0.15 * Math.exp(-t / 0.25));
        var env = Math.min(1, t / 0.02) * Math.min(1, (dur - i) / (0.035 * fs)) * decE;
        add(3, s0, i, 0.35 * env * vL, 0.35 * env * vR);
      }
    }

    // Calibrate each stem to -16.0 LUFS and measure its RMS & Peak characteristics
    var targetE = Math.pow(10, (-16.0 + 0.691) / 10);
    stems.forEach(function (st) {
      var kwL = makeKWeighting(fs), kwR = makeKWeighting(fs);
      var warm = Math.min(len, Math.floor(fs * 0.4));
      for (var i = len - warm; i < len; i++) { procKW(kwL, st.L[i]); procKW(kwR, st.R[i]); }
      var sumE = 0;
      for (var i = 0; i < len; i++) {
        var yl = procKW(kwL, st.L[i]), yr = procKW(kwR, st.R[i]);
        sumE += yl * yl + yr * yr;
      }
      var g = Math.sqrt(targetE / Math.max(1e-12, sumE / len));
      var sq = 0, pk = 0;
      for (var i = 0; i < len; i++) {
        st.L[i] *= g; st.R[i] *= g;
        var a = Math.max(Math.abs(st.L[i]), Math.abs(st.R[i]));
        if (a > pk) pk = a;
        sq += 0.5 * (st.L[i] * st.L[i] + st.R[i] * st.R[i]);
      }
      var rmsDb = 10 * Math.log10(Math.max(1e-12, sq / len));
      var pkDb  = 20 * Math.log10(Math.max(1e-10, pk));
      st.base = { lufs: -16.0, vu: 0.0, rms: rmsDb, peak: pkDb };
    });

    return { len: len, fs: fs, stems: stems };
  }

  // =========================================================================
  //  Web Audio Engine
  // =========================================================================
  var ctx = null;
  var nodes = null;

  function dbToLin(db) { return Math.pow(10, db / 20); }

  function makeShaperCurve(mode) {
    var n = 2048, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1;
      if (mode === 1) { // 4K Solid-State (odd harmonic punch)
        curve[i] = Math.tanh(0.44 * x) / 0.44;
      } else if (mode === 2) { // 73 Class-A (asymmetric even-harmonic warmth)
        var k = 0.48, b = 0.065;
        curve[i] = (Math.tanh(k * (x + b)) - Math.tanh(k * b)) / k;
      } else if (mode === 3) { // US Discrete (soft-knee op-amp)
        var ku = 0.46;
        curve[i] = x / Math.sqrt(1 + (ku * x) * (ku * x));
      } else {
        curve[i] = x;
      }
    }
    return curve;
  }

  function ensureAudio() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    var fs = ctx.sampleRate;
    for (var v = 0; v < VARIATIONS.length; v++) {
      stemBank[v] = synthesizeVariation(v, fs);
    }
    stemBase = stemBank[state.varIdx].stems.map(function (s) { return s.base; });

    var masterGain = ctx.createGain();
    var limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.08;
    masterGain.connect(limiter);
    limiter.connect(ctx.destination);

    var chNodes = STEMS.map(function () {
      var inG = ctx.createGain();
      var faderG = ctx.createGain();
      var muteG = ctx.createGain();
      var shaper = ctx.createWaveShaper();
      shaper.oversample = '2x';
      var eq1 = ctx.createBiquadFilter();
      var eq2 = ctx.createBiquadFilter();
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;

      inG.connect(faderG);
      faderG.connect(muteG);
      muteG.connect(shaper);
      shaper.connect(eq1);
      eq1.connect(eq2);
      eq2.connect(analyser);
      analyser.connect(masterGain);

      return {
        inG: inG, faderG: faderG, muteG: muteG,
        shaper: shaper, eq1: eq1, eq2: eq2,
        analyser: analyser, buf: new Float32Array(2048),
        src: null
      };
    });

    nodes = { masterGain: masterGain, ch: chNodes, curves: [0, 1, 2, 3].map(makeShaperCurve) };
    applyAudioParams();
  }

  function effectiveConsole() {
    if (state.consoleChoice >= 1 && state.consoleChoice <= 4) return state.consoleChoice - 1;
    return GENRES[state.genre].desk - 1; // 0: Lab, 1: 4K, 2: 73, 3: US
  }

  function applyAudioParams() {
    if (stemBank[state.varIdx]) {
      stemBase = stemBank[state.varIdx].stems.map(function (s) { return s.base; });
    }
    if (!nodes || !ctx) return;
    var now = ctx.currentTime;
    var anySolo = state.solo.some(Boolean);
    var desk = state.colorOn ? effectiveConsole() : 0;

    // Loudness compensation for total energy
    var sumE = 0, activeN = 0;
    for (var i = 0; i < 4; i++) {
      var audible = !state.mute[i] && (!anySolo || state.solo[i]);
      var totDb = state.inGain[i] + (state.stage === 1 ? state.fader[i] : 0);
      if (audible) { sumE += Math.pow(10, totDb / 10); activeN++; }
      nodes.ch[i].inG.gain.setTargetAtTime(dbToLin(state.inGain[i]), now, 0.015);
      nodes.ch[i].faderG.gain.setTargetAtTime(state.stage === 1 ? dbToLin(state.fader[i]) : 1.0, now, 0.015);
      nodes.ch[i].muteG.gain.setTargetAtTime(audible ? 1.0 : 0.0, now, 0.012);

      var ch = nodes.ch[i];
      ch.shaper.curve = nodes.curves[desk];
      if (desk === 1) { // 4K
        ch.eq1.type = 'highshelf'; ch.eq1.frequency.value = 9000; ch.eq1.gain.value = 0.4;
        ch.eq2.type = 'peaking';   ch.eq2.frequency.value = 1000; ch.eq2.gain.value = 0;
      } else if (desk === 2) { // 73
        ch.eq1.type = 'peaking';   ch.eq1.frequency.value = 95;   ch.eq1.Q.value = 0.75; ch.eq1.gain.value = 0.5;
        ch.eq2.type = 'highshelf'; ch.eq2.frequency.value = 15000; ch.eq2.gain.value = -0.35;
      } else if (desk === 3) { // US
        ch.eq1.type = 'peaking';   ch.eq1.frequency.value = 1850; ch.eq1.Q.value = 0.70; ch.eq1.gain.value = 0.45;
        ch.eq2.type = 'highshelf'; ch.eq2.frequency.value = 12000; ch.eq2.gain.value = 0;
      } else {
        ch.eq1.type = 'peaking'; ch.eq1.gain.value = 0;
        ch.eq2.type = 'peaking'; ch.eq2.gain.value = 0;
      }
    }

    var compGain = 1.0;
    if (state.loudnessMatch && activeN > 0 && sumE > 1e-9) {
      compGain = Math.min(2.5, Math.max(0.25, Math.sqrt(activeN / sumE)));
    }
    nodes.masterGain.gain.setTargetAtTime(0.45 * compGain, now, 0.02);
  }

  function startPlayback() {
    ensureAudio();
    if (ctx.state === 'suspended') ctx.resume();
    stopSources();
    var bank = stemBank[state.varIdx];
    var t0 = ctx.currentTime + 0.03;
    for (var i = 0; i < 4; i++) {
      var ab = ctx.createBuffer(2, bank.len, bank.fs);
      ab.copyToChannel(bank.stems[i].L, 0);
      ab.copyToChannel(bank.stems[i].R, 1);
      var src = ctx.createBufferSource();
      src.buffer = ab;
      src.loop = true;
      src.connect(nodes.ch[i].inG);
      src.start(t0);
      nodes.ch[i].src = src;
    }
    state.playing = true;
    updatePlayBtn();
  }

  function stopSources() {
    if (!nodes) return;
    nodes.ch.forEach(function (c) {
      if (c.src) { try { c.src.stop(); c.src.disconnect(); } catch (e) {} c.src = null; }
    });
  }

  function togglePlay() {
    if (state.playing) {
      stopSources();
      state.playing = false;
      updatePlayBtn();
    } else {
      startPlayback();
    }
  }

  // =========================================================================
  //  Meter Computation & Canvas Drawing
  // =========================================================================
  function getTargetVal(chIdx) {
    var m = METRICS[state.metric].target;
    if (state.stage === 0) return m;
    return m + GENRES[state.genre].delta[chIdx];
  }

  function getActiveValue(chIdx) {
    var r = readings[chIdx];
    if (state.metric === 0) return r.lufs;
    if (state.metric === 1) return r.vu;
    if (state.metric === 2) return r.rms;
    return r.peak;
  }

  function updateReadings(dt) {
    for (var i = 0; i < 4; i++) {
      var offset = state.inGain[i] + (state.stage === 1 ? state.fader[i] : 0);
      var b = stemBase[i];
      var tLufs = b.lufs + offset;
      var tVu   = b.vu + offset;
      var tRms  = b.rms + offset;
      var tPeak = b.peak + offset;

      if (state.playing && nodes && nodes.ch[i]) {
        var ch = nodes.ch[i];
        ch.analyser.getFloatTimeDomainData(ch.buf);
        var sq = 0, pk = 0;
        for (var k = 0; k < ch.buf.length; k++) {
          var v = ch.buf[k];
          sq += v * v;
          var av = Math.abs(v);
          if (av > pk) pk = av;
        }
        var instRms = 10 * Math.log10(Math.max(1e-10, sq / ch.buf.length));
        var instPk  = 20 * Math.log10(Math.max(1e-10, pk));
        var anySolo = state.solo.some(Boolean);
        var audible = !state.mute[i] && (!anySolo || state.solo[i]);
        if (!audible) {
          tLufs = -60; tVu = -30; tRms = -60; tPeak = -60;
        } else {
          // Blend instantaneous dynamics with calibrated K-weighted stem baseline
          tRms  = readings[i].rms + 0.25 * (instRms - readings[i].rms);
          tPeak = Math.max(instPk, readings[i].peak - 12 * dt);
          tLufs = readings[i].lufs + 0.12 * ((b.lufs + offset) - readings[i].lufs);
          tVu   = readings[i].vu   + 0.18 * ((b.vu + offset) - readings[i].vu);
        }
      }

      readings[i].lufs = tLufs;
      readings[i].vu   = tVu;
      readings[i].rms  = tRms;
      readings[i].peak = tPeak;

      // 2nd-order VU needle physics
      var targetLin = Math.pow(10, Math.max(-24, Math.min(6, readings[i].vu)) / 20);
      var W = 13.2, z = 0.8;
      var acc = W * W * (targetLin - readings[i].vuNeedle) - 2 * z * W * readings[i].vuVel;
      readings[i].vuVel += acc * Math.min(0.05, dt);
      readings[i].vuNeedle = Math.max(0, readings[i].vuNeedle + readings[i].vuVel * Math.min(0.05, dt));
    }
  }

  function resizeCanvas(cv, defaultH) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cv.clientWidth || 400;
    var h = window.NK_H ? window.NK_H(cv, defaultH) : defaultH;
    cv.style.height = h + 'px';
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g: g, w: w, h: h };
  }

  function drawBlindMask(g, w, h) {
    g.fillStyle = 'rgba(239, 232, 216, 0.94)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2c4a6e';
    g.font = '700 14px "Zen Kaku Gothic New", sans-serif';
    g.textAlign = 'center';
    g.fillText(JA ? 'BLIND 耳トレ中（数値と針を非表示）' : 'BLIND MODE (Meters hidden — trust your ears)', w / 2, h / 2 - 4);
    g.fillStyle = '#776d60';
    g.font = '12px "IBM Plex Mono", monospace';
    g.fillText(JA ? 'JUDGE で答え合わせ、または Blind 解除で確認' : 'Press JUDGE to score or toggle Blind off', w / 2, h / 2 + 18);
  }

  function drawGate() {
    var cv = document.getElementById('cv-gate');
    if (!cv) return;
    var r = resizeCanvas(cv, 240);
    var g = r.g, w = r.w, h = r.h;
    g.clearRect(0, 0, w, h);
    if (state.blind) { drawBlindMask(g, w, h); return; }

    var tol = TOLS[state.tolIdx];
    var colW = w / 4;
    var vuH = Math.min(115, Math.max(72, h * 0.48));

    for (var i = 0; i < 4; i++) {
      var x0 = i * colW + 4, cw = colW - 8;
      var cur = getActiveValue(i);
      var tgt = getTargetVal(i);
      var err = cur - tgt;
      var ok = Math.abs(err) <= tol;

      // VU Meter Face
      g.fillStyle = '#f2e3bb';
      g.strokeStyle = '#c4ad82';
      g.lineWidth = 1;
      g.beginPath(); g.roundRect(x0, 2, cw, vuH, 4); g.fill(); g.stroke();

      // Scale arc
      var cx = x0 + cw / 2, cy = vuH + 6, rad = Math.min(cw * 0.44, vuH * 0.85);
      g.strokeStyle = '#776d60'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(cx, cy, rad, Math.PI * 1.18, Math.PI * 1.66); g.stroke();
      g.strokeStyle = '#a5472a'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(cx, cy, rad, Math.PI * 1.66, Math.PI * 1.82); g.stroke();

      // Needle
      var linDb = 20 * Math.log10(Math.max(0.05, readings[i].vuNeedle));
      var norm = Math.max(0, Math.min(1, (linDb + 20) / 23));
      var ang = Math.PI * (1.18 + norm * 0.64);
      g.strokeStyle = '#2b2722'; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad); g.stroke();

      g.fillStyle = '#2a2116'; g.font = '700 10px "IBM Plex Mono", monospace';
      g.textAlign = 'left'; g.fillText((i + 1) + ' ' + STEMS[i].toUpperCase(), x0 + 6, 15);
      g.textAlign = 'right'; g.fillStyle = ok ? '#2d8a4e' : '#a5472a';
      g.fillText(ok ? 'OK' : (err > 0 ? '+' : '') + err.toFixed(1), x0 + cw - 6, 15);

      // Value & Bars below VU
      var yB = vuH + 14;
      g.textAlign = 'left'; g.fillStyle = '#2b2722'; g.font = '700 11px "IBM Plex Mono", monospace';
      g.fillText(METRICS[state.metric].label + ': ' + cur.toFixed(1), x0 + 2, yB + 10);
      g.textAlign = 'right'; g.fillStyle = '#776d60'; g.font = '10px "IBM Plex Mono", monospace';
      g.fillText('T:' + tgt.toFixed(1), x0 + cw - 2, yB + 10);

      // Target gate bar (-36 to 0 dB)
      var barY = yB + 16, barH = 14;
      g.fillStyle = '#e5dbc8';
      g.fillRect(x0, barY, cw, barH);
      var mapX = function (db) { return x0 + Math.max(0, Math.min(1, (db + 36) / 36)) * cw; };
      var gx1 = mapX(tgt - tol), gx2 = mapX(tgt + tol);
      g.fillStyle = ok ? 'rgba(45,138,78,0.28)' : 'rgba(44,74,110,0.18)';
      g.fillRect(gx1, barY, Math.max(2, gx2 - gx1), barH);
      g.strokeStyle = ok ? '#2d8a4e' : '#2c4a6e'; g.lineWidth = 1.5;
      g.strokeRect(gx1, barY, Math.max(2, gx2 - gx1), barH);

      // Current value marker
      var vx = mapX(cur);
      g.fillStyle = ok ? '#2d8a4e' : '#a5472a';
      g.fillRect(vx - 2, barY - 2, 4, barH + 4);

      // Sub-readouts (PK / RMS / LUFS)
      var ySub = barY + 26;
      g.font = '10px "IBM Plex Mono", monospace'; g.textAlign = 'left';
      g.fillStyle = '#a5472a'; g.fillText('PK ' + readings[i].peak.toFixed(1), x0 + 2, ySub);
      g.fillStyle = '#2c4a6e'; g.fillText('RMS ' + readings[i].rms.toFixed(1), x0 + 2, ySub + 13);
      g.fillStyle = '#776d60'; g.fillText('LUFS ' + readings[i].lufs.toFixed(1), x0 + 2, ySub + 26);
    }
  }

  function drawAnchor() {
    var cv = document.getElementById('cv-anchor');
    if (!cv) return;
    var r = resizeCanvas(cv, 190);
    var g = r.g, w = r.w, h = r.h;
    g.clearRect(0, 0, w, h);
    if (state.blind) { drawBlindMask(g, w, h); return; }

    var anchorVal = getActiveValue(0);
    var tol = TOLS[state.tolIdx];
    var padL = 56, padR = 46, padT = 16, padB = 22;
    var plotW = w - padL - padR, plotH = h - padT - padB;
    var mapX = function (d) { return padL + Math.max(0, Math.min(1, (d + 6) / 12)) * plotW; };

    // Grid (-6 to +6 dB)
    g.strokeStyle = '#e5dbc8'; g.lineWidth = 1;
    [-6, -3, 0, 3, 6].forEach(function (db) {
      var x = mapX(db);
      g.beginPath(); g.moveTo(x, padT); g.lineTo(x, padT + plotH); g.stroke();
      g.fillStyle = '#776d60'; g.font = '10px "IBM Plex Mono", monospace'; g.textAlign = 'center';
      g.fillText((db > 0 ? '+' : '') + db + 'dB', x, h - 5);
    });

    var rowH = plotH / 4;
    for (var i = 0; i < 4; i++) {
      var y = padT + i * rowH + rowH * 0.2;
      var bh = rowH * 0.6;
      var delta = getActiveValue(i) - anchorVal;
      var tgtD = state.stage === 1 ? GENRES[state.genre].delta[i] : 0;
      var ok = Math.abs(delta - tgtD) <= tol;

      g.fillStyle = '#2b2722'; g.font = '700 11px "IBM Plex Mono", monospace'; g.textAlign = 'left';
      g.fillText(STEMS[i], 6, y + bh * 0.72);

      // Target band
      var tx1 = mapX(tgtD - tol), tx2 = mapX(tgtD + tol);
      g.fillStyle = ok ? 'rgba(45,138,78,0.22)' : 'rgba(44,74,110,0.16)';
      g.fillRect(tx1, y, Math.max(2, tx2 - tx1), bh);
      g.strokeStyle = ok ? '#2d8a4e' : '#2c4a6e'; g.strokeRect(tx1, y, Math.max(2, tx2 - tx1), bh);

      // Delta bar from 0
      var x0 = mapX(0), x1 = mapX(delta);
      g.fillStyle = i === 0 ? '#776d60' : (ok ? '#2d8a4e' : '#a5472a');
      g.fillRect(Math.min(x0, x1), y + bh * 0.25, Math.max(3, Math.abs(x1 - x0)), bh * 0.5);

      g.textAlign = 'right'; g.fillStyle = ok ? '#2d8a4e' : '#a5472a';
      g.fillText((delta >= 0 ? '+' : '') + delta.toFixed(1), w - 6, y + bh * 0.72);
    }
  }

  function drawMatrix() {
    var cv = document.getElementById('cv-matrix');
    if (!cv) return;
    var r = resizeCanvas(cv, 190);
    var g = r.g, w = r.w, h = r.h;
    g.clearRect(0, 0, w, h);
    if (state.blind) { drawBlindMask(g, w, h); return; }

    var padL = 36, padR = 16, padT = 14, padB = 30;
    var plotW = w - padL - padR, plotH = h - padT - padB;
    var mapY = function (db) { return padT + Math.max(0, Math.min(1, (0 - db) / 30)) * plotH; };

    g.strokeStyle = '#e5dbc8'; g.lineWidth = 1;
    [0, -6, -12, -18, -24, -30].forEach(function (db) {
      var y = mapY(db);
      g.beginPath(); g.moveTo(padL, y); g.lineTo(w - padR, y); g.stroke();
      g.fillStyle = '#776d60'; g.font = '10px "IBM Plex Mono", monospace'; g.textAlign = 'right';
      g.fillText(db, padL - 5, y + 3);
    });

    var xs = [0, 1, 2, 3].map(function (i) { return padL + (i + 0.5) * (plotW / 4); });
    var series = [
      { key: 'peak', color: '#a5472a', vals: readings.map(function (x) { return x.peak; }) },
      { key: 'rms',  color: '#2c4a6e', vals: readings.map(function (x) { return x.rms; }) },
      { key: 'lufs', color: '#b86a0c', vals: readings.map(function (x) { return x.lufs; }) },
      { key: 'vu',   color: '#2b2722', vals: readings.map(function (x) { return x.vu - 18; }) }
    ];

    series.forEach(function (s) {
      g.strokeStyle = s.color; g.lineWidth = 2;
      g.beginPath();
      s.vals.forEach(function (v, idx) {
        var x = xs[idx], y = mapY(v);
        if (idx === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.stroke();
      s.vals.forEach(function (v, idx) {
        g.fillStyle = s.color;
        g.beginPath(); g.arc(xs[idx], mapY(v), 3.2, 0, Math.PI * 2); g.fill();
      });
    });

    for (var i = 0; i < 4; i++) {
      var crest = Math.max(0, readings[i].peak - readings[i].rms);
      g.fillStyle = '#2b2722'; g.font = '700 10.5px "IBM Plex Mono", monospace'; g.textAlign = 'center';
      g.fillText(STEMS[i], xs[i], h - 15);
      g.fillStyle = '#776d60'; g.font = '9.5px "IBM Plex Mono", monospace';
      g.fillText('C:' + crest.toFixed(1), xs[i], h - 4);
    }
  }

  // =========================================================================
  //  Trainer Actions
  // =========================================================================
  function randomizeInput() {
    var offsets = [-6.5, -4.0, -2.5, 2.5, 4.5, 6.0];
    for (var i = 0; i < 4; i++) {
      var d = offsets[Math.floor(Math.random() * offsets.length)] + (Math.random() - 0.5) * 2;
      state.inGain[i] = Math.round(d * 10) / 10;
    }
    state.judge = null;
    syncUI();
  }

  function autoTrim() {
    var tgt = METRICS[state.metric].target;
    for (var i = 0; i < 4; i++) {
      var baseVal = state.metric === 0 ? stemBase[i].lufs
                  : state.metric === 1 ? stemBase[i].vu
                  : state.metric === 2 ? stemBase[i].rms : stemBase[i].peak;
      state.inGain[i] = Math.round((tgt - baseVal) * 10) / 10;
    }
    state.judge = null;
    syncUI();
  }

  function applyGenreFaders() {
    var d = GENRES[state.genre].delta;
    for (var i = 0; i < 4; i++) state.fader[i] = d[i];
    state.stage = 1;
    state.judge = null;
    syncUI();
  }

  function runJudge() {
    var tol = TOLS[state.tolIdx];
    var maxErr = 0;
    for (var i = 0; i < 4; i++) {
      var err = Math.abs(getActiveValue(i) - getTargetVal(i));
      if (err > maxErr) maxErr = err;
    }
    var score = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, maxErr - tol * 0.25) * 24)));
    state.judge = { pass: maxErr <= tol, score: score, maxErr: maxErr };
    syncUI();
  }

  function saveOrLoadSnap(idx) {
    if (!state.snapshots[idx]) {
      state.snapshots[idx] = {
        inGain: state.inGain.slice(),
        fader: state.fader.slice(),
        genre: state.genre,
        stage: state.stage,
        consoleChoice: state.consoleChoice,
        colorOn: state.colorOn
      };
      state.activeSnap = idx;
    } else {
      var s = state.snapshots[idx];
      state.inGain = s.inGain.slice();
      state.fader = s.fader.slice();
      state.genre = s.genre;
      state.stage = s.stage;
      state.consoleChoice = s.consoleChoice;
      state.colorOn = s.colorOn;
      state.activeSnap = idx;
    }
    syncUI();
  }

  function loadLesson(idx) {
    var L = LESSONS[idx];
    state.stage = L.stage;
    state.metric = L.metric;
    state.genre = L.genre;
    state.varIdx = L.varIdx;
    if (L.stage === 0) {
      state.fader = [0, 0, 0, 0];
      autoTrim();
      if (idx === 2) randomizeInput();
    } else {
      autoTrim();
      applyGenreFaders();
      if (idx === 4) state.colorOn = true;
    }
    if (state.playing) startPlayback();
    syncUI();
  }

  // =========================================================================
  //  UI Sync & Event Wiring
  // =========================================================================
  function updatePlayBtn() {
    var b = document.getElementById('mbl-play');
    if (!b) return;
    b.setAttribute('aria-pressed', state.playing ? 'true' : 'false');
    b.textContent = state.playing ? (JA ? '■ 停止' : '■ Stop') : (JA ? '▶ 再生' : '▶ Play');
  }

  function syncUI() {
    applyAudioParams();
    updateReadings(0.016);

    // Step buttons
    document.querySelectorAll('[data-stage]').forEach(function (b) {
      b.setAttribute('aria-pressed', Number(b.dataset.stage) === state.stage ? 'true' : 'false');
    });
    // Metric buttons
    document.querySelectorAll('[data-metric]').forEach(function (b) {
      b.setAttribute('aria-pressed', Number(b.dataset.metric) === state.metric ? 'true' : 'false');
    });
    // Genre buttons
    document.querySelectorAll('[data-genre]').forEach(function (b) {
      b.setAttribute('aria-pressed', Number(b.dataset.genre) === state.genre ? 'true' : 'false');
    });
    // Blind & Color & Loudness Match
    var blindBtn = document.getElementById('mbl-blind');
    if (blindBtn) blindBtn.setAttribute('aria-pressed', state.blind ? 'true' : 'false');
    var colorBtn = document.getElementById('mbl-color');
    if (colorBtn) colorBtn.setAttribute('aria-pressed', state.colorOn ? 'true' : 'false');
    var lmBtn = document.getElementById('mbl-lmatch');
    if (lmBtn) lmBtn.setAttribute('aria-pressed', state.loudnessMatch ? 'true' : 'false');

    var deskTag = document.getElementById('mbl-desk-tag');
    if (deskTag) deskTag.textContent = CONSOLES[effectiveConsole() + 1].name + (state.colorOn ? ' (COLOR ON)' : ' (Bypass)');

    var varSel = document.getElementById('mbl-var');
    if (varSel) varSel.value = String(state.varIdx);
    var conSel = document.getElementById('mbl-console');
    if (conSel) conSel.value = String(state.consoleChoice);
    var tolSel = document.getElementById('mbl-tol');
    if (tolSel) tolSel.value = String(state.tolIdx);

    // Strips
    var tol = TOLS[state.tolIdx];
    for (var i = 0; i < 4; i++) {
      var gEl = document.getElementById('mbl-g-' + i);
      var gvEl = document.getElementById('mbl-gv-' + i);
      var fEl = document.getElementById('mbl-f-' + i);
      var fvEl = document.getElementById('mbl-fv-' + i);
      var led = document.getElementById('mbl-led-' + i);
      var gWrap = document.getElementById('mbl-gw-' + i);
      var fWrap = document.getElementById('mbl-fw-' + i);
      if (gEl) gEl.value = state.inGain[i];
      if (gvEl) gvEl.textContent = (state.inGain[i] >= 0 ? '+' : '') + state.inGain[i].toFixed(1) + 'dB';
      if (fEl) fEl.value = state.fader[i];
      if (fvEl) fvEl.textContent = (state.fader[i] >= 0 ? '+' : '') + state.fader[i].toFixed(1) + 'dB';
      if (gWrap) gWrap.classList.toggle('active', state.stage === 0);
      if (fWrap) fWrap.classList.toggle('active', state.stage === 1);
      if (led) {
        var ok = Math.abs(getActiveValue(i) - getTargetVal(i)) <= tol;
        led.classList.toggle('ok', ok);
      }
      var sBtn = document.getElementById('mbl-s-' + i);
      var mBtn = document.getElementById('mbl-m-' + i);
      if (sBtn) sBtn.dataset.solo = state.solo[i] ? 'true' : 'false';
      if (mBtn) mBtn.dataset.mute = state.mute[i] ? 'true' : 'false';
    }

    // Snapshots
    for (var s = 0; s < 3; s++) {
      var sb = document.getElementById('mbl-snap-' + s);
      if (!sb) continue;
      var lbl = ['A', 'B', 'C'][s];
      sb.textContent = state.snapshots[s] ? (lbl + ':' + GENRES[state.snapshots[s].genre].name) : (lbl + (JA ? ':空' : ':Empty'));
      sb.setAttribute('aria-pressed', state.activeSnap === s ? 'true' : 'false');
    }

    // Judge result
    var jr = document.getElementById('mbl-judge-res');
    if (jr) {
      if (!state.judge) {
        jr.className = 'mbl-judge-res';
        jr.textContent = JA ? 'JUDGE で判定（目標 ±' + tol + ' dB）' : 'Press JUDGE (Target ±' + tol + ' dB)';
      } else {
        jr.className = 'mbl-judge-res ' + (state.judge.pass ? 'pass' : 'retry');
        jr.textContent = (state.judge.pass ? 'PASS ' : 'RETRY ') + state.judge.score + (JA ? '点' : ' pts') +
          ' (' + (JA ? '最大誤差 ' : 'Max err ') + state.judge.maxErr.toFixed(2) + ' dB)';
      }
    }

    // Highlight active genre row in table
    document.querySelectorAll('#mbl-genre-table tr[data-row]').forEach(function (tr) {
      tr.classList.toggle('active', Number(tr.dataset.row) === state.genre);
    });
  }

  function buildGenreTable() {
    var tb = document.getElementById('mbl-genre-table');
    if (!tb) return;
    tb.innerHTML = '<tr><th>Genre</th><th>Kick</th><th>Bass</th><th>Snare</th><th>Vocal</th></tr>' +
      GENRES.map(function (g, i) {
        return '<tr data-row="' + i + '"><td>' + g.name + '</td>' +
          g.delta.map(function (v) { return '<td>' + (v >= 0 ? '+' : '') + v.toFixed(1) + '</td>'; }).join('') + '</tr>';
      }).join('');
  }

  function buildLessons() {
    var box = document.getElementById('mbl-lessons-list');
    if (!box) return;
    box.innerHTML = LESSONS.map(function (L, idx) {
      return '<div class="mbl-lesson-card">' +
        '<div class="mbl-lesson-badge">' + L.badge + '</div>' +
        '<h4>' + (JA ? L.titleJa : L.titleEn) + '</h4>' +
        '<p>' + (JA ? L.bodyJa : L.bodyEn) + '</p>' +
        '<div class="tries"><button type="button" class="btn" data-lesson="' + idx + '">' +
        (JA ? 'この設定で試す' : 'Try this lesson') + '</button></div>' +
        '</div>';
    }).join('');
    box.querySelectorAll('[data-lesson]').forEach(function (b) {
      b.addEventListener('click', function () { loadLesson(Number(b.dataset.lesson)); });
    });
  }

  function initEvents() {
    var playBtn = document.getElementById('mbl-play');
    if (playBtn) playBtn.addEventListener('click', togglePlay);

    var varSel = document.getElementById('mbl-var');
    if (varSel) varSel.addEventListener('change', function () {
      state.varIdx = Number(varSel.value);
      if (state.playing) startPlayback(); else syncUI();
    });

    document.querySelectorAll('[data-stage]').forEach(function (b) {
      b.addEventListener('click', function () { state.stage = Number(b.dataset.stage); state.judge = null; syncUI(); });
    });
    document.querySelectorAll('[data-metric]').forEach(function (b) {
      b.addEventListener('click', function () { state.metric = Number(b.dataset.metric); state.judge = null; syncUI(); });
    });
    document.querySelectorAll('[data-genre]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.genre = Number(b.dataset.genre);
        state.stage = 1;
        state.judge = null;
        syncUI();
      });
    });

    var blindBtn = document.getElementById('mbl-blind');
    if (blindBtn) blindBtn.addEventListener('click', function () { state.blind = !state.blind; syncUI(); });

    var colorBtn = document.getElementById('mbl-color');
    if (colorBtn) colorBtn.addEventListener('click', function () { state.colorOn = !state.colorOn; syncUI(); });

    var conSel = document.getElementById('mbl-console');
    if (conSel) conSel.addEventListener('change', function () { state.consoleChoice = Number(conSel.value); syncUI(); });

    var tolSel = document.getElementById('mbl-tol');
    if (tolSel) tolSel.addEventListener('change', function () { state.tolIdx = Number(tolSel.value); state.judge = null; syncUI(); });

    var lmBtn = document.getElementById('mbl-lmatch');
    if (lmBtn) lmBtn.addEventListener('click', function () { state.loudnessMatch = !state.loudnessMatch; syncUI(); });

    document.getElementById('mbl-rand').addEventListener('click', randomizeInput);
    document.getElementById('mbl-autotrim').addEventListener('click', autoTrim);
    document.getElementById('mbl-fader0').addEventListener('click', function () {
      state.fader = [0, 0, 0, 0]; state.judge = null; syncUI();
    });
    document.getElementById('mbl-apply-genre').addEventListener('click', applyGenreFaders);
    document.getElementById('mbl-judge').addEventListener('click', runJudge);

    var clearSnaps = document.getElementById('mbl-snap-clear');
    if (clearSnaps) clearSnaps.addEventListener('click', function () {
      state.snapshots = [null, null, null]; state.activeSnap = -1; syncUI();
    });

    for (var s = 0; s < 3; s++) {
      (function (idx) {
        var sb = document.getElementById('mbl-snap-' + idx);
        if (sb) sb.addEventListener('click', function () { saveOrLoadSnap(idx); });
      })(s);
    }

    for (var i = 0; i < 4; i++) {
      (function (idx) {
        var gEl = document.getElementById('mbl-g-' + idx);
        var fEl = document.getElementById('mbl-f-' + idx);
        var sBtn = document.getElementById('mbl-s-' + idx);
        var mBtn = document.getElementById('mbl-m-' + idx);
        if (gEl) gEl.addEventListener('input', function () {
          state.inGain[idx] = Number(gEl.value); state.judge = null; syncUI();
        });
        if (fEl) fEl.addEventListener('input', function () {
          state.fader[idx] = Number(fEl.value); state.stage = 1; state.judge = null; syncUI();
        });
        if (sBtn) sBtn.addEventListener('click', function () {
          state.solo[idx] = !state.solo[idx]; syncUI();
        });
        if (mBtn) mBtn.addEventListener('click', function () {
          state.mute[idx] = !state.mute[idx]; syncUI();
        });
      })(i);
    }
  }

  // Real-time observation hook for note-kit (.nk-obs)
  window.NK_OBS = window.NK_OBS || {};
  window.NK_OBS.mbl = function (ja) {
    var tol = TOLS[state.tolIdx];
    var mName = METRICS[state.metric].label;
    var g = GENRES[state.genre];
    var maxErr = 0, worst = 0;
    for (var i = 0; i < 4; i++) {
      var e = Math.abs(getActiveValue(i) - getTargetVal(i));
      if (e > maxErr) { maxErr = e; worst = i; }
    }
    var deskName = CONSOLES[effectiveConsole() + 1].name;
    var snCrest = (readings[2].peak - readings[2].rms).toFixed(1);
    var baCrest = (readings[1].peak - readings[1].rms).toFixed(1);

    if (ja) {
      return [
        ['手順', (state.stage === 0 ? 'STEP 1（Input Gain 揃え）' : 'STEP 2（Main Fader: ' + g.name + '）') + ' / 基準: ' + mName],
        ['判定目安', maxErr <= tol ? '全ch 許容幅（±' + tol + ' dB）内 — JUDGE 合格圏' : STEMS[worst] + ' が目標から ' + maxErr.toFixed(1) + ' dB ズレ'],
        ['卓の色付け', deskName + (state.colorOn ? '（COLOR ON：倍音＋微細EQ付加）' : '（COLOR OFF：完全バイパス）')],
        ['Crest 差', 'Snare ' + snCrest + ' dB ／ Bass ' + baCrest + ' dB（同じ音量でもピーク差がこれだけ違う）']
      ];
    }
    return [
      ['Stage', (state.stage === 0 ? 'STEP 1 (Input Trim)' : 'STEP 2 (Fader: ' + g.name + ')') + ' · Metric: ' + mName],
      ['Target', maxErr <= tol ? 'All channels within ±' + tol + ' dB — Ready for JUDGE' : STEMS[worst] + ' off by ' + maxErr.toFixed(1) + ' dB'],
      ['Console', deskName + (state.colorOn ? ' (COLOR ON)' : ' (Bypass)')],
      ['Crest', 'Snare ' + snCrest + ' dB vs Bass ' + baCrest + ' dB (peak-to-RMS gap)']
    ];
  };

  window.MBL_REDRAW = function () {
    drawGate();
    drawAnchor();
    drawMatrix();
  };

  var lastT = performance.now();
  function tick(now) {
    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;
    updateReadings(dt);
    drawGate();
    drawAnchor();
    drawMatrix();
    requestAnimationFrame(tick);
  }

  buildGenreTable();
  buildLessons();
  initEvents();
  syncUI();
  requestAnimationFrame(tick);
})();
