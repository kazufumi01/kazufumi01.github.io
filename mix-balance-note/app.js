/* Mix Balance Lab — Web Edition (Faithful DSP, 4-Stem Synth, 3-Way Meter Bridge & Console UI) */
(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'ja').toLowerCase().startsWith('en') ? 'en' : 'ja';
  var JA = LANG === 'ja';

  var DEFAULT_NAMES = ['KICK', 'BASS', 'SNARE', 'VOCAL'];
  var METRICS = [
    { id: 'lufs', label: 'LUFS-M', short: 'LUFS', target: -16.0 },
    { id: 'vu',   label: 'VU',     short: 'VU',   target: 0.0 },
    { id: 'rms',  label: 'RMS',    short: 'RMS',  target: -16.0 },
    { id: 'peak', label: 'Peak',   short: 'PK',   target: -8.0 }
  ];

  var CONSOLES = [
    { id: 'auto', name: 'Auto' },
    { id: 'lab',  name: 'Lab Reference' },
    { id: '4k',   name: '4K Solid-State' },
    { id: '73',   name: '73 Class-A' },
    { id: 'us',   name: 'US Discrete' }
  ];
  var DESK_KEYS = ['lab', '4k', '73', 'us'];
  var DESK_SHORT = ['Lab', '4K', '73-A', 'US'];

  var GENRES = [
    { id: 'flat',      name: 'Flat',       delta: [0, 0, 0, 0],        desk: 1,
      titleJa: 'Flat（基礎：4トラック同音量）', titleEn: 'Flat (Foundation: Equal Level)',
      ja: 'まず全フェーダーを 0 dB に置き、上部の INPUT GAIN ノブだけで 4 トラックすべてを基準値（−16 LUFS-M / 0 VU）に揃えます。',
      en: 'Keep all Main Faders at 0 dB and use only the INPUT GAIN knobs to match all 4 tracks to −16 LUFS-M / 0 VU.',
      whyJa: '同じ LUFS-M に揃えても、Snare は Peak が高く、Bass は RMS が高く、耳での前後感も音色ごとに違うことを基準耳として覚えます。',
      whyEn: 'Even at identical LUFS-M, Snare peaks much higher and Bass reads higher in RMS. Learn how equal loudness feels.' },
    { id: 'jpop',      name: 'J-Pop',      delta: [0, -1.5, 0.5, 3.0], desk: 2,
      titleJa: 'J-Pop（歌最優先バランス）', titleEn: 'J-Pop (Vocal-Forward Pop)',
      ja: 'INPUT GAIN で揃えた状態から、Main Fader で Bass −1.5 / Snare +0.5 / Vocal +3.0 dB の段差を作ります。',
      en: 'From matched Input Trim, set Main Faders to Kick 0.0, Bass −1.5, Snare +0.5, and Vocal +3.0 dB.',
      whyJa: '歌詞とメロディが最優先で届くよう Vocal を +3 dB 前に出し、低域（Bass −1.5 dB）を整理して歌のスペースを空けます。',
      whyEn: 'Pushes Vocal +3 dB forward so lyrics cut clearly while trimming Bass (−1.5 dB) to leave headroom.' },
    { id: 'kpop',      name: 'K-Pop',      delta: [0, -0.5, 0.5, 1.5], desk: 2,
      titleJa: 'K-Pop（高密度・低域＆歌の両立）', titleEn: 'K-Pop (High-Impact Modern Pop)',
      ja: 'Kick 0.0 / Bass −0.5 / Snare +0.5 / Vocal +1.5 dB にフェーダーを設定し、J-Pop との重心の違いを聴き比べます。',
      en: 'Set Main Faders to Kick 0.0, Bass −0.5, Snare +0.5, and Vocal +1.5 dB, then A/B against J-Pop.',
      whyJa: 'J-Pop(+3 dB) よりリズム隊(Kick/Bass)の比重が高く、タイトな低域と Vocal(+1.5 dB) が同じ熱量で前に出るバランスです。',
      whyEn: 'Heavier Kick & Bass weight than J-Pop so the low-end groove and Vocal (+1.5 dB) hit with equal energy.' },
    { id: 'rnb',       name: 'R&B',        delta: [0, 0.5, -1.5, 2.0], desk: 3,
      titleJa: 'R&B（深いベースと艶のある歌）', titleEn: 'R&B (Deep Pocket & Warm Vocal)',
      ja: 'Snare を −1.5 dB 奥に引き、Bass +0.5 dB と Vocal +2.0 dB で包容力のあるポケットを作ります。',
      en: 'Tuck Snare back to −1.5 dB while lifting Bass (+0.5 dB) and Vocal (+2.0 dB) for a warm pocket.',
      whyJa: '70年代英国クラスAトランス卓（ブルーグレー外装）のイメージ。スネアの鋭さを抑え、豊かな Bass がキックを包み込みます。',
      whyEn: 'Classic UK Class-A console feel: Snare steps back (−1.5 dB) while warm Bass (+0.5 dB) and Vocal (+2.0 dB) carry the groove.' },
    { id: 'edm',       name: 'EDM',        delta: [0, -0.5, -1.0, -1.0], desk: 2,
      titleJa: 'EDM（Kick & Sub Bass 主役）', titleEn: 'EDM (Club Kick & Bass Driven)',
      ja: 'Kick(0.0 dB) と Bass(−0.5 dB) を最大にし、Snare(−1.0) と Vocal/Lead(−1.0) をリズムの壁の中に収めます。',
      en: 'Keep Kick (0.0) and Bass (−0.5) dominant, tucking Snare (−1.0) and Lead/Vocal (−1.0) inside the rhythm wall.',
      whyJa: 'クラブフロアで体感する Kick と Sub Bass が基準。リードや歌を上げすぎると逆にドロップの迫力が小さく聴こえます。',
      whyEn: 'Kick and Bass own the ceiling; raising Lead too high actually makes the drop feel smaller after loudness matching.' },
    { id: 'hiphop',    name: 'Hip-Hop',    delta: [0, -0.5, -1.0, 1.0], desk: 2,
      titleJa: 'Hip-Hop（808低域とラップの2軸）', titleEn: 'Hip-Hop (808 Low-End & Vocal)',
      ja: 'Kick 0.0 / Bass −0.5 dB の太い土台の上に、Vocal を +1.0 dB 乗せ、Snare は −1.0 dB でコンパクトに置きます。',
      en: 'Anchor Kick (0.0) and Bass (−0.5), place Vocal at +1.0 dB, and keep Snare compact at −1.0 dB.',
      whyJa: 'R&B より Kick がタイトに前に出て、Snare は鋭いアタックだけで抜けるため −1.0 dB でも十分聴こえます。',
      whyEn: 'Tighter Kick presence than R&B; crisp Snare transients cut through even at −1.0 dB LUFS.' },
    { id: 'rock',      name: 'Rock',       delta: [0, -1.0, 1.5, 1.0], desk: 3,
      titleJa: 'Rock（スネアの推進力と歌の拮抗）', titleEn: 'Rock (Backbeat Snare & Vocal)',
      ja: '2拍・4拍の Snare を +1.5 dB まで押し出し、Vocal(+1.0 dB) と拮抗するバンドの推進力を作ります。',
      en: 'Drive the backbeat Snare up to +1.5 dB so it matches and propels the Vocal (+1.0 dB) over Bass (−1.0 dB).',
      whyJa: 'ロックの躍動感はスネアの大きさと音抜けで決まります。73 Class-A 外装＋COLOR ON で中低域の厚みも試せます。',
      whyEn: 'Rock energy lives in the backbeat Snare (+1.5 dB) locking with Vocal (+1.0 dB). Try COLOR ON with 73 Class-A.' },
    { id: 'indiepop',  name: 'IndiePop',   delta: [0, -0.5, 0.0, 1.5], desk: 4,
      titleJa: 'Indie Pop（親密で自然な溶け合い）', titleEn: 'Indie Pop (Intimate & Blended)',
      ja: 'Kick 0.0 / Bass −0.5 / Snare 0.0 / Vocal +1.5 dB。J-Pop ほど歌を離さず、楽器の近くに歌を置きます。',
      en: 'Set Kick 0.0, Bass −0.5, Snare 0.0, and Vocal +1.5 dB for an intimate, close-knit band blend.',
      whyJa: 'ウッドチーク付き米国ディスクリート卓イメージ。歌(+1.5 dB)が伴奏から浮きすぎず、部屋の空気感を共有します。',
      whyEn: 'Wood-trimmed US Discrete desk: Vocal (+1.5 dB) sits close to the instruments rather than floating far in front.' },
    { id: 'indierock', name: 'IndieRock',  delta: [0, 0.0, 1.0, -0.5], desk: 4,
      titleJa: 'Indie Rock（歌をバンドの塊に馴染ませる）', titleEn: 'Indie Rock (Tucked Vocal & Raw Band)',
      ja: 'Snare を +1.0 dB 立たせ、あえて Vocal を −0.5 dB に置いてリズムとバンドの塊の中に馴染ませます。',
      en: 'Push Snare to +1.0 dB and deliberately tuck Vocal slightly to −0.5 dB inside the band wall.',
      whyJa: '歌モノ＝常にボーカルが一番大きいとは限りません。Vocal を −0.5 dB 沈めることでインディー特有の一体感が生まれます。',
      whyEn: 'Tucking Vocal to −0.5 dB beneath Snare (+1.0 dB) creates authentic indie/alternative band cohesion.' }
  ];

  var LESSONS = [
    { badge: 'LESSON 01 / 06', stage: 0, metric: 3, view: 0, genre: 0, varIdx: 0,
      titleJa: 'Peak で4トラックを −8 dBFS に揃えてみよう',
      titleEn: 'Match all 4 tracks to −8 dBFS Peak',
      bodyJa: '1. [STEP 1: Input 同音量揃え] と基準メーター [Peak] を選びます。\n2. 4本の INPUT GAIN ノブを回して Peak を −8.0 dBFS に揃え、JUDGE を押します。\n→ 揃えて聴くと、アタックの鋭い Snare だけが小さく、持続音の Bass/Vocal が大きく聴こえることを確認！',
      bodyEn: '1. Select [STEP 1: Input Trim] and [Peak] meter.\n2. Turn the 4 INPUT GAIN knobs to match Peak at −8.0 dBFS and press JUDGE.\n-> Notice Snare sounds quiet while sustained Bass & Vocal sound loud!' },
    { badge: 'LESSON 02 / 06', stage: 0, metric: 1, view: 2, genre: 0, varIdx: 0,
      titleJa: 'VU と RMS で揃え、Crest（ピークの飛び出し）を見る',
      titleEn: 'Match by VU / RMS and observe Crest differences',
      bodyJa: '1. 基準メーターを [VU] に切り替え、4つの針が 0.0 VU 付近になるよう INPUT GAIN を調整します。\n2. 上部タブを [③ Matrix] に切り替えてみましょう。\n→ 平均値（VU/RMS）で揃えると聴感は近づきますが、Snare の Peak（赤線）が大きく飛び出すことが分かります。',
      bodyEn: '1. Switch metric to [VU] and match all 4 needles near 0.0 VU using INPUT GAIN.\n2. Switch view to [③ Matrix].\n-> Loudness feels closer, while Snare Peak (red line) jumps high above RMS!' },
    { badge: 'LESSON 03 / 06', stage: 0, metric: 0, view: 0, genre: 0, varIdx: 0,
      titleJa: 'LUFS-M で −16 LUFS にゲインステージング完了！',
      titleEn: 'Gain-stage all 4 tracks to −16.0 LUFS-M',
      bodyJa: '1. 基準メーターを [LUFS] にし、INPUT GAIN で全4トラックを −16.0 LUFS に揃えます（●揃いランプ点灯）。\n2. [Blind] を ON にして耳だけで揃え、JUDGE で答え合わせする耳トレも試せます。\n→ これで Fader 0 dB ＝ 全パート同ラウドネスの土台ができました！',
      bodyEn: '1. Select [LUFS] and adjust INPUT GAIN until all 4 tracks sit at −16.0 LUFS (LED green).\n2. Try [Blind] mode + [Randomize] to train your ears without looking!\n-> Now Fader 0 dB = matched loudness across every channel.' },
    { badge: 'LESSON 04 / 06', stage: 1, metric: 0, view: 1, genre: 2, varIdx: 1,
      titleJa: 'J-Pop と K-Pop をフェーダーで作って A/B 比較',
      titleEn: 'Build J-Pop vs K-Pop on Main Faders & A/B compare',
      bodyJa: '1. [STEP 2: Fader ジャンル差] に切り替え、INPUT GAIN は触らず縦フェーダーを動かします。\n2. [J-Pop]（Vocal +3.0 / Bass −1.5）を作って JUDGE → Snapshot [A] に保存。\n3. [K-Pop]（Vocal +1.5 / Bass −0.5）を作って Snapshot [B] に保存し、音量補正 ON で A/B 比較！',
      bodyEn: '1. Switch to [STEP 2: Genre Faders] and leave INPUT GAIN untouched.\n2. Dial in [J-Pop] (Vocal +3.0, Bass −1.5), press JUDGE, and store to Snapshot [A].\n3. Dial in [K-Pop] (Vocal +1.5, Bass −0.5), store to [B], and A/B with Loudness Match ON!' },
    { badge: 'LESSON 05 / 06', stage: 1, metric: 0, view: 1, genre: 3, varIdx: 2,
      titleJa: 'Hip-Hop と R&B：低域の重心とスネアの距離感',
      titleEn: 'Hip-Hop vs R&B: Low-end pocket & Snare depth',
      bodyJa: '1. [Hip-Hop]（Snare −1.0 / Vocal +1.0）と [R&B]（Bass +0.5 / Snare −1.5 / Vocal +2.0）を切り替えます。\n2. R&B ではコンソールが 73 Class-A 外装に変わります。[COLOR] ボタンを ON にして倍音の温かみも聴いてみましょう。',
      bodyEn: '1. Compare [Hip-Hop] against [R&B] (Bass +0.5, Snare −1.5, Vocal +2.0).\n2. Notice the desk switches to 73 Class-A; toggle [COLOR] ON to audition subtle transformer warmth.' },
    { badge: 'LESSON 06 / 06', stage: 1, metric: 0, view: 2, genre: 8, varIdx: 3,
      titleJa: 'Rock / Indie Pop / Indie Rock：ボーカルの前後感',
      titleEn: 'Rock, Indie Pop & Indie Rock: Vocal placement',
      bodyJa: '1. [Rock]（Snare +1.5 / Vocal +1.0）、[Indie Pop]（Vocal +1.5）、[Indie Rock]（Snare +1.0 / Vocal −0.5）を比較します。\n→ あえてボーカルを −0.5 dB 沈める Indie Rock で、バンドの塊感がどう変わるか聴き比べましょう！',
      bodyEn: '1. Compare [Rock] (Snare +1.5), [Indie Pop] (Vocal +1.5), and [Indie Rock] (Snare +1.0, Vocal −0.5).\n-> Hear how tucking Vocal to −0.5 dB glues it inside the raw band mix!' }
  ];

  var VARIATIONS = [
    { short: 'Pop 96',   bpm: 96 },
    { short: 'Dance 116', bpm: 116 },
    { short: 'R&B 84',   bpm: 84 },
    { short: 'Rock 124', bpm: 124 },
    { short: 'Trap 92',  bpm: 92 }
  ];

  var TOLS = [1.5, 0.8, 0.3];

  var state = {
    playing: false,
    varIdx: 0,
    view: 0,          // 0: Target Gate, 1: Anchor Delta, 2: Crest Matrix
    stage: 0,         // 0: Step1 (Input Trim), 1: Step2 (Fader)
    metric: 0,        // 0: LUFS-M, 1: VU, 2: RMS, 3: Peak
    genre: 0,         // 0..8
    tolIdx: 1,        // 0: 1.5, 1: 0.8, 2: 0.3
    consoleChoice: 0, // 0: Auto, 1: Lab, 2: 4K, 3: 73, 4: US
    colorOn: false,
    postMeter: true,  // Pre / Post toggle in Master Bridge
    blind: false,
    anchorIdx: 0,     // 0..3
    loudnessMatch: true,
    guideOpen: true,
    lessonIdx: 0,
    order: [0, 1, 2, 3], // slot -> stem index
    names: DEFAULT_NAMES.slice(),
    inGain: [0, 0, 0, 0],
    fader:  [0, 0, 0, 0],
    solo:   [false, false, false, false],
    mute:   [false, false, false, false],
    snapshots: [null, null, null],
    activeSnap: -1,
    judge: null
  };

  var stemBase = [
    { lufs: -16.0, vu: 0.0, rms: -16.8, peak: -6.2 },
    { lufs: -16.0, vu: 0.0, rms: -13.6, peak: -10.8 },
    { lufs: -16.0, vu: 0.0, rms: -19.2, peak: -2.4 },
    { lufs: -16.0, vu: 0.0, rms: -16.4, peak: -8.1 }
  ];

  var readings = [
    { lufs: -16, vu: 0, rms: -16.8, peak: -6.2, vuNeedle: 0, vuVel: 0 },
    { lufs: -16, vu: 0, rms: -13.6, peak: -10.8, vuNeedle: 0, vuVel: 0 },
    { lufs: -16, vu: 0, rms: -19.2, peak: -2.4, vuNeedle: 0, vuVel: 0 },
    { lufs: -16, vu: 0, rms: -16.4, peak: -8.1, vuNeedle: 0, vuVel: 0 }
  ];

  // =========================================================================
  //  ITU-R BS.1770 K-Weighting + StemSynth (4-Stem Loop Synthesis)
  // =========================================================================
  function makeBiquad(b0, b1, b2, a1, a2) { return { b0: b0, b1: b1, b2: b2, a1: a1, a2: a2, z1: 0, z2: 0 }; }
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
    return function () { s = (1664525 * s + 1013904223) >>> 0; return (s / 4294967296) * 2 - 1; };
  }

  var stemBank = [];
  function synthesizeVariation(v, fs) {
    var bpms = [96, 116, 84, 124, 92];
    var beatS = 60 / bpms[v];
    var len = Math.max(1024, Math.round(fs * beatS * 8));
    var stems = [0, 1, 2, 3].map(function () { return { L: new Float32Array(len), R: new Float32Array(len) }; });
    function add(s, start, i, l, r) {
      var idx = (start + i) % len;
      if (idx < 0) idx += len;
      stems[s].L[idx] += l; stems[s].R[idx] += r;
    }

    var kPat = [[0,1,2,2.75,3,4,5,6.5],[0,1,2,3,4,5,6,7],[0,1.5,2,3.75,4,5.5,6,7.5],[0,1.5,2,2.5,4,5.5,6,7.25],[0,1.75,2.5,4,5.25,6,7.5]][v];
    var fBase = [50,54,44,58,42][v], fSwp = [110,130,85,95,90][v], kDec = [0.14,0.11,0.22,0.09,0.28][v], kClk = [0.25,0.35,0.12,0.42,0.18][v];
    var kDur = Math.floor(0.45 * fs);
    kPat.forEach(function (b) {
      var s0 = Math.round(b * beatS * fs), ph = 0;
      for (var i = 0; i < kDur; i++) {
        var t = i / fs, f = fBase + fSwp * Math.exp(-t / 0.022);
        ph += 2 * Math.PI * f / fs;
        var clk = kClk * Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-t / 0.003);
        var env = Math.min(1, t / 0.0012) * Math.exp(-t / kDec);
        var val = Math.tanh(1.25 * (0.9 * Math.sin(ph) + clk)) * env;
        add(0, s0, i, val, val);
      }
    });

    var roots = v === 4 ? [48.9994, 43.6535] : [55.0, 43.6535];
    for (var bar = 0; bar < 2; bar++) {
      var f0 = roots[bar], steps = v === 1 ? 8 : 4;
      for (var st = 0; st < steps; st++) {
        var sb = v === 1 ? st * 0.5 : (st === 1 ? 1.5 : st === 2 ? 2 : st === 3 ? 3 : 0);
        var sd = v === 1 ? 0.44 : (st === 0 ? 1.42 : st === 1 ? 0.48 : 0.94);
        var mult = (v === 1 && st % 2 === 1) ? 2 : ((st === 3 && v !== 4) ? 1.5 : 1);
        var s0 = Math.round((bar * 4 + sb) * beatS * fs), dur = Math.round(sd * beatS * fs);
        var f = f0 * mult, ph = 0;
        for (var i = 0; i < dur; i++) {
          var t = i / fs, att = Math.min(1, t / (v === 2 ? 0.015 : 0.006)), rel = Math.min(1, (dur - i) / (0.015 * fs));
          ph += 2 * Math.PI * f / fs;
          var sig = v === 3
            ? Math.tanh(1.9 * (0.65 * Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.22 * Math.sin(3 * ph)))
            : (v === 2 || v === 4)
              ? Math.tanh(1.1 * (0.88 * Math.sin(ph) + 0.16 * Math.sin(2 * ph)))
              : Math.tanh(1.4 * (0.75 * Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)));
          add(1, s0, i, 0.55 * att * rel * sig, 0.55 * att * rel * sig);
        }
      }
    }

    var rnd = seededRand(404 + v * 37);
    var lpA = 1 - Math.exp(-2 * Math.PI * (v === 3 ? 5800 : 5000) / fs);
    var hpA = 1 - Math.exp(-2 * Math.PI * 620 / fs);
    for (var bar = 0; bar < 2; bar++) {
      var div = (v === 1 || v === 4) ? 16 : 8;
      for (var e = 0; e < div; e++) {
        var s0 = Math.round((bar * 4 + e * (4 / div)) * beatS * fs);
        var dur = Math.floor((v === 4 ? 0.10 : 0.20) * fs), acc = e % 2 === 0 ? 0.22 : 0.13, low = 0, top = 0;
        for (var i = 0; i < dur; i++) {
          var t = i / fs, nz = rnd();
          low += hpA * (nz - low); top += lpA * ((nz - low) - top);
          var val = acc * top * Math.min(1, t / 0.002) * Math.exp(-t / (v === 4 ? 0.032 : 0.080));
          add(2, s0, i, val * 0.94, val * 1.06);
        }
      }
      [1.0, 3.0].forEach(function (beat) {
        var s0 = Math.round((bar * 4 + beat) * beatS * fs), dur = Math.floor(0.40 * fs), low = 0, band = 0;
        var bodyF = v === 2 ? 310 : v === 4 ? 225 : 192, bodyD = v === 2 ? 0.025 : 0.072, wireD = v === 1 ? 0.085 : v === 3 ? 0.14 : 0.10;
        for (var i = 0; i < dur; i++) {
          var t = i / fs, nz = rnd();
          low += hpA * (nz - low); band += lpA * ((nz - low) - band);
          var wires = band * (0.75 * Math.exp(-t / wireD) + 0.25 * Math.exp(-t / 0.22));
          var body = 0.68 * Math.sin(2 * Math.PI * (bodyF + 45 * Math.exp(-t / 0.012)) * t) * Math.exp(-t / bodyD);
          var env = Math.min(1, t / 0.001);
          add(2, s0, i, 0.55 * env * Math.tanh(1.6 * (body + wires * 0.96)), 0.55 * env * Math.tanh(1.6 * (body + wires * 1.04)));
        }
      });
    }

    var mel = [[440,493.88,523.25,493.88,349.23,392,440,523.25],[523.25,587.33,659.25,523.25,440,523.25,587.33,493.88],[392,440,493.88,440,349.23,392,440,329.63],[440,440,523.25,587.33,349.23,392,440,392],[392,466.16,587.33,466.16,349.23,440,523.25,440]][v];
    function makeBand(f0, q) {
      var w0 = 2 * Math.PI * f0 / fs, a = Math.sin(w0) / (2 * q), a0 = 1 + a;
      return makeBiquad(a / a0, 0, -a / a0, (-2 * Math.cos(w0)) / a0, (1 - a) / a0);
    }
    var f1 = v === 2 ? 620 : v === 3 ? 1150 : 780, f2 = v === 1 ? 2450 : v === 4 ? 1950 : 2150;
    var fm1L = makeBand(f1, 2.2), fm1R = makeBand(f1 + 10, 2.2), fm2L = makeBand(f2, 2.6), fm2R = makeBand(f2 - 20, 2.6);
    var phL = 0, phR = 0, maxH = v === 2 ? 4 : v === 3 ? 9 : 7;
    for (var st = 0; st < 8; st++) {
      var s0 = Math.round(st * beatS * fs), dur = Math.round((v === 4 ? 0.72 : 0.94) * beatS * fs), bf = mel[st];
      for (var i = 0; i < dur; i++) {
        var t = i / fs, vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.14), f = bf * vib;
        phL += 2 * Math.PI * f * 0.999 / fs; phR += 2 * Math.PI * f * 1.001 / fs;
        var rL = 0, rR = 0;
        for (var h = 1; h <= maxH; h++) {
          var amp = (v === 3 && h % 2 === 1) ? (1.3 / h) : (1 / h);
          rL += amp * Math.sin(h * phL); rR += amp * Math.sin(h * phR);
        }
        var vL = 0.45 * rL + 1.15 * procBiquad(fm1L, rL) + 0.55 * procBiquad(fm2L, rL);
        var vR = 0.45 * rR + 1.15 * procBiquad(fm1R, rR) + 0.55 * procBiquad(fm2R, rR);
        var decE = v === 4 ? Math.exp(-t / 0.24) : (0.85 + 0.15 * Math.exp(-t / 0.25));
        var env = Math.min(1, t / 0.02) * Math.min(1, (dur - i) / (0.035 * fs)) * decE;
        add(3, s0, i, 0.35 * env * vL, 0.35 * env * vR);
      }
    }

    var targetE = Math.pow(10, (-16.0 + 0.691) / 10);
    stems.forEach(function (st) {
      var kwL = makeKWeighting(fs), kwR = makeKWeighting(fs);
      var warm = Math.min(len, Math.floor(fs * 0.4));
      for (var i = len - warm; i < len; i++) { procKW(kwL, st.L[i]); procKW(kwR, st.R[i]); }
      var sumE = 0;
      for (var i = 0; i < len; i++) { var yl = procKW(kwL, st.L[i]), yr = procKW(kwR, st.R[i]); sumE += yl * yl + yr * yr; }
      var g = Math.sqrt(targetE / Math.max(1e-12, sumE / len));
      var sq = 0, pk = 0;
      for (var i = 0; i < len; i++) {
        st.L[i] *= g; st.R[i] *= g;
        var a = Math.max(Math.abs(st.L[i]), Math.abs(st.R[i]));
        if (a > pk) pk = a;
        sq += 0.5 * (st.L[i] * st.L[i] + st.R[i] * st.R[i]);
      }
      st.base = { lufs: -16.0, vu: 0.0, rms: 10 * Math.log10(Math.max(1e-12, sq / len)), peak: 20 * Math.log10(Math.max(1e-10, pk)) };
    });
    return { len: len, fs: fs, stems: stems };
  }

  // =========================================================================
  //  Web Audio Engine
  // =========================================================================
  var ctx = null, nodes = null;
  function dbToLin(db) { return Math.pow(10, db / 20); }
  function makeShaperCurve(mode) {
    var n = 2048, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1;
      if (mode === 1) curve[i] = Math.tanh(0.44 * x) / 0.44;
      else if (mode === 2) curve[i] = (Math.tanh(0.48 * (x + 0.065)) - Math.tanh(0.48 * 0.065)) / 0.48;
      else if (mode === 3) curve[i] = x / Math.sqrt(1 + (0.46 * x) * (0.46 * x));
      else curve[i] = x;
    }
    return curve;
  }

  function ensureAudio() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    var fs = ctx.sampleRate;
    for (var v = 0; v < VARIATIONS.length; v++) stemBank[v] = synthesizeVariation(v, fs);
    stemBase = stemBank[state.varIdx].stems.map(function (s) { return s.base; });

    var masterGain = ctx.createGain();
    var limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5; limiter.ratio.value = 12; limiter.attack.value = 0.002; limiter.release.value = 0.08;
    masterGain.connect(limiter); limiter.connect(ctx.destination);

    var chNodes = [0, 1, 2, 3].map(function () {
      var inG = ctx.createGain(), faderG = ctx.createGain(), muteG = ctx.createGain();
      var shaper = ctx.createWaveShaper(); shaper.oversample = '2x';
      var eq1 = ctx.createBiquadFilter(), eq2 = ctx.createBiquadFilter();
      var analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
      inG.connect(faderG); faderG.connect(muteG); muteG.connect(shaper);
      shaper.connect(eq1); eq1.connect(eq2); eq2.connect(analyser); analyser.connect(masterGain);
      return { inG: inG, faderG: faderG, muteG: muteG, shaper: shaper, eq1: eq1, eq2: eq2, analyser: analyser, buf: new Float32Array(2048), src: null };
    });
    nodes = { masterGain: masterGain, ch: chNodes, curves: [0, 1, 2, 3].map(makeShaperCurve) };
    applyAudioParams();
  }

  function effectiveConsole() {
    if (state.consoleChoice >= 1 && state.consoleChoice <= 4) return state.consoleChoice - 1;
    return GENRES[state.genre].desk - 1;
  }

  function applyAudioParams() {
    if (stemBank[state.varIdx]) stemBase = stemBank[state.varIdx].stems.map(function (s) { return s.base; });
    if (!nodes || !ctx) return;
    var now = ctx.currentTime, anySolo = state.solo.some(Boolean), desk = state.colorOn ? effectiveConsole() : 0;
    var sumE = 0, activeN = 0;
    for (var i = 0; i < 4; i++) {
      var audible = !state.mute[i] && (!anySolo || state.solo[i]);
      var totDb = state.inGain[i] + state.fader[i];
      if (audible) { sumE += Math.pow(10, totDb / 10); activeN++; }
      nodes.ch[i].inG.gain.setTargetAtTime(dbToLin(state.inGain[i]), now, 0.015);
      nodes.ch[i].faderG.gain.setTargetAtTime(dbToLin(state.fader[i]), now, 0.015);
      nodes.ch[i].muteG.gain.setTargetAtTime(audible ? 1.0 : 0.0, now, 0.012);
      var ch = nodes.ch[i];
      ch.shaper.curve = nodes.curves[desk];
      if (desk === 1) { ch.eq1.type = 'highshelf'; ch.eq1.frequency.value = 9000; ch.eq1.gain.value = 0.4; ch.eq2.type = 'peaking'; ch.eq2.gain.value = 0; }
      else if (desk === 2) { ch.eq1.type = 'peaking'; ch.eq1.frequency.value = 95; ch.eq1.Q.value = 0.75; ch.eq1.gain.value = 0.5; ch.eq2.type = 'highshelf'; ch.eq2.frequency.value = 15000; ch.eq2.gain.value = -0.35; }
      else if (desk === 3) { ch.eq1.type = 'peaking'; ch.eq1.frequency.value = 1850; ch.eq1.Q.value = 0.70; ch.eq1.gain.value = 0.45; ch.eq2.type = 'peaking'; ch.eq2.gain.value = 0; }
      else { ch.eq1.type = 'peaking'; ch.eq1.gain.value = 0; ch.eq2.type = 'peaking'; ch.eq2.gain.value = 0; }
    }
    var compGain = 1.0;
    if (state.loudnessMatch && activeN > 0 && sumE > 1e-9) compGain = Math.min(2.5, Math.max(0.25, Math.sqrt(activeN / sumE)));
    nodes.masterGain.gain.setTargetAtTime(0.45 * compGain, now, 0.02);
  }

  function startPlayback() {
    ensureAudio();
    if (ctx.state === 'suspended') ctx.resume();
    stopSources();
    var bank = stemBank[state.varIdx], t0 = ctx.currentTime + 0.03;
    for (var i = 0; i < 4; i++) {
      var ab = ctx.createBuffer(2, bank.len, bank.fs);
      ab.copyToChannel(bank.stems[i].L, 0); ab.copyToChannel(bank.stems[i].R, 1);
      var src = ctx.createBufferSource(); src.buffer = ab; src.loop = true;
      src.connect(nodes.ch[i].inG); src.start(t0); nodes.ch[i].src = src;
    }
    state.playing = true; updatePlayBtn();
  }
  function stopSources() {
    if (!nodes) return;
    nodes.ch.forEach(function (c) { if (c.src) { try { c.src.stop(); c.src.disconnect(); } catch (e) {} c.src = null; } });
  }
  function togglePlay() {
    if (state.playing) { stopSources(); state.playing = false; updatePlayBtn(); }
    else startPlayback();
  }

  // =========================================================================
  //  Meter Computation & 3-Way Meter Bridge Drawing
  // =========================================================================
  function getTargetVal(stemIdx) {
    var m = METRICS[state.metric].target;
    if (state.stage === 0) return m;
    return m + GENRES[state.genre].delta[stemIdx];
  }
  function getStableValue(stemIdx) {
    var fdr = state.postMeter ? state.fader[stemIdx] : 0;
    var offset = state.inGain[stemIdx] + fdr;
    var b = stemBase[stemIdx];
    if (state.metric === 0) return b.lufs + offset;
    if (state.metric === 1) return b.vu + offset;
    if (state.metric === 2) return b.rms + offset;
    return b.peak + offset;
  }

  function updateReadings(dt) {
    var anySolo = state.solo.some(Boolean);
    for (var i = 0; i < 4; i++) {
      var fdr = state.postMeter ? state.fader[i] : 0;
      var offset = state.inGain[i] + fdr;
      var b = stemBase[i];
      var tLufs = b.lufs + offset, tVu = b.vu + offset, tRms = b.rms + offset, tPeak = b.peak + offset;

      if (state.playing && nodes && nodes.ch[i]) {
        var ch = nodes.ch[i];
        ch.analyser.getFloatTimeDomainData(ch.buf);
        var sq = 0, pk = 0;
        for (var k = 0; k < ch.buf.length; k++) {
          var v = ch.buf[k]; sq += v * v;
          var av = Math.abs(v); if (av > pk) pk = av;
        }
        var preComp = state.postMeter ? 0 : -state.fader[i];
        var instRms = 10 * Math.log10(Math.max(1e-10, sq / ch.buf.length)) + preComp;
        var instPk  = 20 * Math.log10(Math.max(1e-10, pk)) + preComp;
        var audible = !state.mute[i] && (!anySolo || state.solo[i]);
        if (!audible) { tLufs = -60; tVu = -30; tRms = -60; tPeak = -60; }
        else {
          tRms  = readings[i].rms + 0.25 * (instRms - readings[i].rms);
          tPeak = Math.max(instPk, readings[i].peak - 1.5 * dt);
          tLufs = readings[i].lufs + 0.12 * ((b.lufs + offset) - readings[i].lufs);
          tVu   = readings[i].vu   + 0.18 * ((b.vu + offset) - readings[i].vu);
        }
      }
      readings[i].lufs = tLufs; readings[i].vu = tVu; readings[i].rms = tRms; readings[i].peak = tPeak;

      var targetLin = Math.pow(10, Math.max(-24, Math.min(6, readings[i].vu)) / 20);
      var W = 13.2, z = 0.8;
      var acc = W * W * (targetLin - readings[i].vuNeedle) - 2 * z * W * readings[i].vuVel;
      readings[i].vuVel += acc * Math.min(0.05, dt);
      readings[i].vuNeedle = Math.max(0, readings[i].vuNeedle + readings[i].vuVel * Math.min(0.05, dt));
    }
  }

  function resizeBridgeCanvas() {
    var cv = document.getElementById('cv-bridge');
    if (!cv) return null;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cv.clientWidth || 700, h = cv.clientHeight || 196;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g: g, w: w, h: h };
  }

  function drawBlindOverlay(g, w, h) {
    g.fillStyle = '#15181e'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f0a63a'; g.font = '700 15px "Zen Kaku Gothic New", sans-serif'; g.textAlign = 'center';
    g.fillText(JA ? 'BLIND 耳トレ中（メーター非表示）' : 'BLIND MODE (Meters Hidden — Use Your Ears)', w / 2, h / 2 - 6);
    g.fillStyle = '#9aa3b2'; g.font = '12px "IBM Plex Mono", monospace';
    g.fillText(JA ? 'JUDGE でスコア確認 / Blind 解除で答え合わせ' : 'Press JUDGE to check score or toggle Blind off', w / 2, h / 2 + 16);
  }

  function drawBridge() {
    var res = resizeBridgeCanvas();
    if (!res) return;
    var g = res.g, w = res.w, h = res.h;
    g.clearRect(0, 0, w, h);
    if (state.blind) { drawBlindOverlay(g, w, h); return; }

    var tol = TOLS[state.tolIdx];
    var colW = w / 4;

    if (state.view === 0) {
      // ① Target Gate (4x Analog VU + PK/RMS/LUFS bars)
      var vuH = Math.min(104, h * 0.52);
      for (var slot = 0; slot < 4; slot++) {
        var st = state.order[slot];
        var x0 = slot * colW + 4, cw = colW - 8;
        var cur = getStableValue(st), tgt = getTargetVal(st), err = cur - tgt, ok = Math.abs(err) <= tol;

        // Top header pill
        g.fillStyle = '#1c2028'; g.strokeStyle = '#343a46'; g.lineWidth = 1;
        g.beginPath(); g.roundRect(x0, 2, cw, 20, 3); g.fill(); g.stroke();
        g.fillStyle = '#eceff4'; g.font = '700 10.5px "IBM Plex Mono", monospace'; g.textAlign = 'left';
        g.fillText((slot + 1) + ' ' + state.names[st], x0 + 6, 15);
        g.fillStyle = ok ? '#38b26a' : '#f0a63a'; g.textAlign = 'right';
        g.fillText((err >= 0 ? '+' : '') + err.toFixed(1) + (ok ? ' OK' : ''), x0 + cw - 6, 15);

        // Cream VU Face
        var vy = 26;
        g.fillStyle = '#f3e8cf'; g.strokeStyle = '#8b7b5e';
        g.beginPath(); g.roundRect(x0, vy, cw, vuH, 4); g.fill(); g.stroke();
        var cx = x0 + cw / 2, cy = vy + vuH + 4, rad = Math.min(cw * 0.44, vuH * 0.85);
        g.strokeStyle = '#4a3d2d'; g.lineWidth = 1.4;
        g.beginPath(); g.arc(cx, cy, rad, Math.PI * 1.18, Math.PI * 1.66); g.stroke();
        g.strokeStyle = '#c83a2e'; g.lineWidth = 2.6;
        g.beginPath(); g.arc(cx, cy, rad, Math.PI * 1.66, Math.PI * 1.82); g.stroke();
        g.fillStyle = '#5c4e3c'; g.font = '700 10px "IBM Plex Mono", monospace'; g.textAlign = 'center';
        g.fillText('VU', cx, vy + vuH * 0.58);

        var linDb = 20 * Math.log10(Math.max(0.05, readings[st].vuNeedle));
        var norm = Math.max(0, Math.min(1, (linDb + 20) / 23));
        var ang = Math.PI * (1.18 + norm * 0.64);
        g.strokeStyle = '#1a1510'; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(cx, cy - 8); g.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad); g.stroke();

        // PK / RMS / LUFS bars below VU
        var by = vy + vuH + 10;
        var rows = [
          { lbl: 'PK',   val: state.metric === 3 ? getStableValue(st) : readings[st].peak, col: '#e05246' },
          { lbl: 'RMS',  val: readings[st].rms,  col: '#d08a1c' },
          { lbl: 'LUFS', val: readings[st].lufs, col: '#38b26a' }
        ];
        rows.forEach(function (rw, ri) {
          var ry = by + ri * 19;
          g.fillStyle = '#9aa3b2'; g.font = '10px "IBM Plex Mono", monospace'; g.textAlign = 'left';
          g.fillText(rw.lbl, x0 + 2, ry + 8);
          g.fillStyle = '#eceff4'; g.textAlign = 'right';
          g.fillText(rw.val.toFixed(1), x0 + cw - 2, ry + 8);
          g.fillStyle = '#1b1f26'; g.fillRect(x0 + 2, ry + 11, cw - 4, 4);
          var pct = Math.max(0, Math.min(1, (rw.val + 36) / 36));
          g.fillStyle = rw.col; g.fillRect(x0 + 2, ry + 11, (cw - 4) * pct, 4);
        });
      }
    } else if (state.view === 1) {
      // ② Anchor ΔdB
      var anc = state.anchorIdx;
      var ancVal = getStableValue(anc);
      for (var slot = 0; slot < 4; slot++) {
        var st = state.order[slot];
        var x0 = slot * colW + 4, cw = colW - 8;
        var delta = getStableValue(st) - ancVal;
        var tgtD = state.stage === 1 ? (GENRES[state.genre].delta[st] - GENRES[state.genre].delta[anc]) : 0;
        var ok = Math.abs(delta - tgtD) <= tol;

        g.fillStyle = '#15181f'; g.strokeStyle = st === anc ? '#f0a63a' : '#2c323d'; g.lineWidth = 1;
        g.beginPath(); g.roundRect(x0, 2, cw, h - 4, 4); g.fill(); g.stroke();

        g.fillStyle = '#eceff4'; g.font = '700 10.5px "IBM Plex Mono", monospace'; g.textAlign = 'left';
        g.fillText((slot + 1) + ' ' + state.names[st], x0 + 7, 17);
        g.textAlign = 'right'; g.fillStyle = st === anc ? '#f0a63a' : (ok ? '#38b26a' : '#e05246');
        g.fillText(st === anc ? 'ANCHOR' : 'T:' + (tgtD >= 0 ? '+' : '') + tgtD.toFixed(1), x0 + cw - 7, 17);

        var topY = 28, botY = h - 22, midY = (topY + botY) / 2;
        var mapY = function (d) { return midY - (Math.max(-6, Math.min(6, d)) / 6) * ((botY - topY) * 0.45); };
        [-4, -2, 0, 2, 4].forEach(function (db) {
          var y = mapY(db);
          g.strokeStyle = db === 0 ? '#4a5262' : '#242933'; g.beginPath(); g.moveTo(x0 + 6, y); g.lineTo(x0 + cw - 6, y); g.stroke();
          g.fillStyle = '#6f7887'; g.font = '9px "IBM Plex Mono", monospace'; g.textAlign = 'left';
          g.fillText((db > 0 ? '+' : '') + db, x0 + 7, y - 2);
        });

        // Target green box
        var ty1 = mapY(tgtD + tol), ty2 = mapY(tgtD - tol);
        g.fillStyle = 'rgba(56,178,106,0.14)'; g.fillRect(x0 + 24, ty1, cw - 36, Math.max(4, ty2 - ty1));
        g.strokeStyle = '#38b26a'; g.strokeRect(x0 + 24, ty1, cw - 36, Math.max(4, ty2 - ty1));

        // Current delta bar
        var y0 = mapY(0), y1 = mapY(delta);
        g.fillStyle = ok ? '#38b26a' : '#f0a63a';
        g.fillRect(x0 + cw * 0.42, Math.min(y0, y1), cw * 0.24, Math.max(3, Math.abs(y1 - y0)));

        g.fillStyle = st === anc ? '#f0a63a' : (ok ? '#38b26a' : '#eceff4');
        g.font = '700 11px "IBM Plex Mono", monospace'; g.textAlign = 'center';
        g.fillText('Δ ' + (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' dB', x0 + cw / 2, h - 7);
      }
    } else {
      // ③ Crest Matrix
      var padL = 34, padR = 16, padT = 22, padB = 26;
      var plotW = w - padL - padR, plotH = h - padT - padB;
      var mapY = function (db) { return padT + Math.max(0, Math.min(1, (0 - db) / 30)) * plotH; };

      g.font = '10px "IBM Plex Mono", monospace'; g.textAlign = 'left';
      g.fillStyle = '#e05246'; g.fillText('●Peak(赤)', padL, 13);
      g.fillStyle = '#4a8fe7'; g.fillText('●RMS(青)', padL + 72, 13);
      g.fillStyle = '#f0a63a'; g.fillText('●LUFS-M(橙)', padL + 138, 13);
      g.fillStyle = '#eceff4'; g.fillText('●VU換算(白)', padL + 224, 13);
      g.fillStyle = '#38b26a'; g.fillText('--目標(緑) C=Crest', padL + 310, 13);

      g.strokeStyle = '#252a34'; g.lineWidth = 1;
      [0, -6, -12, -18, -24].forEach(function (db) {
        var y = mapY(db);
        g.beginPath(); g.moveTo(padL, y); g.lineTo(w - padR, y); g.stroke();
        g.fillStyle = '#7f8897'; g.textAlign = 'right'; g.fillText(db, padL - 5, y + 3);
      });

      var xs = [0, 1, 2, 3].map(function (slot) { return padL + (slot + 0.5) * (plotW / 4); });
      var orderStems = state.order;
      var series = [
        { col: '#e05246', vals: orderStems.map(function (st) { return state.metric === 3 ? stemBase[st].peak + state.inGain[st] + (state.postMeter ? state.fader[st] : 0) : readings[st].peak; }) },
        { col: '#4a8fe7', vals: orderStems.map(function (st) { return readings[st].rms; }) },
        { col: '#f0a63a', vals: orderStems.map(function (st) { return readings[st].lufs; }) },
        { col: '#eceff4', vals: orderStems.map(function (st) { return readings[st].vu - 16; }) }
      ];

      // Target dashed green line
      g.save(); g.setLineDash([4, 4]); g.strokeStyle = '#38b26a'; g.lineWidth = 1.5;
      g.beginPath();
      orderStems.forEach(function (st, idx) {
        var tgt = -16 + (state.stage === 1 ? GENRES[state.genre].delta[st] : 0);
        var x = xs[idx], y = mapY(tgt);
        if (idx === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.stroke(); g.restore();

      series.forEach(function (s) {
        g.strokeStyle = s.col; g.lineWidth = 2; g.beginPath();
        s.vals.forEach(function (v, idx) {
          var x = xs[idx], y = mapY(v);
          if (idx === 0) g.moveTo(x, y); else g.lineTo(x, y);
        });
        g.stroke();
        s.vals.forEach(function (v, idx) {
          g.fillStyle = s.col; g.beginPath(); g.arc(xs[idx], mapY(v), 3.2, 0, Math.PI * 2); g.fill();
        });
      });

      orderStems.forEach(function (st, slot) {
        var crest = Math.max(0, readings[st].peak - readings[st].rms);
        g.fillStyle = '#eceff4'; g.font = '700 10.5px "IBM Plex Mono", monospace'; g.textAlign = 'center';
        g.fillText((slot + 1) + ' ' + state.names[st] + ' C:' + crest.toFixed(1), xs[slot], h - 6);
      });
    }
  }

  // =========================================================================
  //  Trainer Actions & UI Sync
  // =========================================================================
  function randomizeInput() {
    var offsets = [-6.5, -4.0, -2.5, 2.5, 4.5, 6.0];
    for (var i = 0; i < 4; i++) state.inGain[i] = Math.round((offsets[Math.floor(Math.random() * offsets.length)] + (Math.random() - 0.5) * 2) * 10) / 10;
    state.judge = null; syncUI();
  }
  function autoTrim() {
    var tgt = METRICS[state.metric].target;
    for (var i = 0; i < 4; i++) {
      var bv = state.metric === 0 ? stemBase[i].lufs : state.metric === 1 ? stemBase[i].vu : state.metric === 2 ? stemBase[i].rms : stemBase[i].peak;
      state.inGain[i] = Math.round((tgt - bv) * 10) / 10;
    }
    state.judge = null; syncUI();
  }
  function applyGenreFaders() {
    var d = GENRES[state.genre].delta;
    for (var i = 0; i < 4; i++) state.fader[i] = d[i];
    state.stage = 1; state.judge = null; syncUI();
  }
  function runJudge() {
    var tol = TOLS[state.tolIdx], maxErr = 0;
    for (var i = 0; i < 4; i++) {
      var err = Math.abs(getStableValue(i) - getTargetVal(i));
      if (err > maxErr) maxErr = err;
    }
    var score = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, maxErr - tol * 0.25) * 24)));
    state.judge = { pass: maxErr <= tol, score: score, maxErr: maxErr };
    syncUI();
  }
  function saveOrLoadSnap(idx) {
    if (!state.snapshots[idx]) {
      state.snapshots[idx] = { inGain: state.inGain.slice(), fader: state.fader.slice(), genre: state.genre, stage: state.stage, consoleChoice: state.consoleChoice, colorOn: state.colorOn };
      state.activeSnap = idx;
    } else {
      var s = state.snapshots[idx];
      state.inGain = s.inGain.slice(); state.fader = s.fader.slice(); state.genre = s.genre; state.stage = s.stage;
      state.consoleChoice = s.consoleChoice; state.colorOn = s.colorOn; state.activeSnap = idx;
    }
    syncUI();
  }
  function applyLesson(idx) {
    state.lessonIdx = (idx + LESSONS.length) % LESSONS.length;
    var L = LESSONS[state.lessonIdx];
    state.stage = L.stage; state.metric = L.metric; state.view = L.view; state.genre = L.genre; state.varIdx = L.varIdx;
    if (L.stage === 0) { state.fader = [0, 0, 0, 0]; autoTrim(); if (state.lessonIdx === 2) randomizeInput(); }
    else { autoTrim(); applyGenreFaders(); if (state.lessonIdx === 4) state.colorOn = true; }
    if (state.playing) startPlayback();
    syncUI();
  }
  function resetAll() {
    state.inGain = [0, 0, 0, 0]; state.fader = [0, 0, 0, 0];
    state.solo = [false, false, false, false]; state.mute = [false, false, false, false];
    state.order = [0, 1, 2, 3]; state.names = DEFAULT_NAMES.slice();
    state.genre = 0; state.stage = 0; state.colorOn = false; state.consoleChoice = 0; state.judge = null;
    syncUI();
  }

  function renderKnob(slot, val) {
    var ptr = document.getElementById('mbl-kp-' + slot);
    var arc = document.getElementById('mbl-ka-' + slot);
    var norm = Math.max(-1, Math.min(1, val / 18));
    if (ptr) ptr.setAttribute('transform', 'rotate(' + (norm * 135).toFixed(1) + ' 25 25)');
    if (arc) {
      var r = 20, cx = 25, cy = 25, a0 = -Math.PI / 2, a1 = a0 + norm * (135 * Math.PI / 180);
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      arc.setAttribute('d', Math.abs(norm) < 0.01 ? '' : 'M ' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A ' + r + ' ' + r + ' 0 0 ' + (norm >= 0 ? 1 : 0) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1));
    }
  }
  function dbToPct(db) { return 8 + ((12 - Math.max(-24, Math.min(12, db))) / 36) * 84; }

  function updatePlayBtn() {
    var b = document.getElementById('mbl-play');
    if (!b) return;
    b.setAttribute('aria-pressed', state.playing ? 'true' : 'false');
    b.textContent = state.playing ? '■ Stop' : '▶ 4Stem';
  }

  function updateLedMeters() {
    var anySolo = state.solo.some(Boolean);
    for (var slot = 0; slot < 4; slot++) {
      var st = state.order[slot];
      var box = document.getElementById('mbl-ledm-' + slot);
      if (!box) continue;
      var audible = !state.mute[st] && (!anySolo || state.solo[st]);
      var lvl = audible ? readings[st].lufs : -60;
      var lit = Math.max(0, Math.min(12, Math.round(((lvl + 36) / 36) * 12)));
      var segs = box.children;
      for (var k = 0; k < segs.length; k++) {
        segs[k].classList.toggle('on', k < lit);
      }
    }
  }

  function syncUI() {
    var deskIdx = effectiveConsole();
    document.documentElement.setAttribute('data-desk', DESK_KEYS[deskIdx]);
    applyAudioParams();
    updateReadings(0.016);

    document.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.view) === state.view ? 'true' : 'false'); });
    document.querySelectorAll('[data-stage]').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.stage) === state.stage ? 'true' : 'false'); });
    document.querySelectorAll('[data-metric]').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.metric) === state.metric ? 'true' : 'false'); });
    document.querySelectorAll('[data-genre]').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.genre) === state.genre ? 'true' : 'false'); });
    document.querySelectorAll('[data-tol]').forEach(function (b) { b.setAttribute('aria-pressed', Number(b.dataset.tol) === state.tolIdx ? 'true' : 'false'); });

    var autoOpt = document.querySelector('#mbl-console option[value="0"]');
    if (autoOpt) autoOpt.textContent = 'Auto:' + CONSOLES[GENRES[state.genre].desk].name;
    document.getElementById('mbl-console').value = String(state.consoleChoice);
    document.getElementById('mbl-var').value = String(state.varIdx);
    document.getElementById('mbl-anchor').value = String(state.anchorIdx);
    document.getElementById('mbl-color').setAttribute('aria-pressed', state.colorOn ? 'true' : 'false');
    document.getElementById('mbl-blind').setAttribute('aria-pressed', state.blind ? 'true' : 'false');
    document.getElementById('mbl-pre').setAttribute('aria-pressed', !state.postMeter ? 'true' : 'false');
    document.getElementById('mbl-post').setAttribute('aria-pressed', state.postMeter ? 'true' : 'false');
    document.getElementById('mbl-lmatch').setAttribute('aria-pressed', state.loudnessMatch ? 'true' : 'false');

    // Guide panel toggle
    var guide = document.getElementById('mbl-guide');
    var gBtn = document.getElementById('mbl-guide-toggle');
    if (guide) guide.hidden = !state.guideOpen;
    if (gBtn) gBtn.textContent = state.guideOpen ? (JA ? '解説を閉じる ▸' : 'Hide Guide ▸') : (JA ? '◀ 解説を開く' : '◀ Open Guide');

    var tol = TOLS[state.tolIdx];
    for (var slot = 0; slot < 4; slot++) {
      var st = state.order[slot];
      document.getElementById('mbl-chnum-' + slot).textContent = 'CH ' + (slot + 1);
      document.getElementById('mbl-gv-' + slot).textContent = (state.inGain[st] >= 0 ? '+' : '') + state.inGain[st].toFixed(1) + 'dB';
      document.getElementById('mbl-fv-' + slot).textContent = 'FDR ' + (state.fader[st] >= 0 ? '+' : '') + state.fader[st].toFixed(1) + ' dB';
      document.getElementById('mbl-tape-' + slot).textContent = state.names[st];
      renderKnob(slot, state.inGain[st]);
      document.getElementById('mbl-fc-' + slot).style.top = dbToPct(state.fader[st]).toFixed(2) + '%';

      var brk = document.getElementById('mbl-brk-' + slot);
      if (brk) {
        var tgtF = state.stage === 1 ? GENRES[state.genre].delta[st] : 0;
        var tTop = dbToPct(tgtF + tol), tBot = dbToPct(tgtF - tol);
        brk.style.top = tTop.toFixed(2) + '%';
        brk.style.height = Math.max(4, tBot - tTop).toFixed(2) + '%';
      }

      var ok = Math.abs(getStableValue(st) - getTargetVal(st)) <= tol;
      document.getElementById('mbl-led-' + slot).classList.toggle('ok', ok);
      document.getElementById('mbl-trim-' + slot).classList.toggle('ok', ok);
      document.getElementById('mbl-s-' + slot).dataset.solo = state.solo[st] ? 'true' : 'false';
      document.getElementById('mbl-m-' + slot).dataset.mute = state.mute[st] ? 'true' : 'false';
    }

    // Master Bridge list
    var ancVal = getStableValue(state.anchorIdx), minV = 999, maxV = -999;
    var mbHtml = state.order.map(function (st, slot) {
      var d = getStableValue(st) - ancVal;
      if (d < minV) minV = d; if (d > maxV) maxV = d;
      var tgtD = state.stage === 1 ? (GENRES[state.genre].delta[st] - GENRES[state.genre].delta[state.anchorIdx]) : 0;
      var ok = Math.abs(d - tgtD) <= tol;
      return '<div class="mbl-mb-item"><span>' + (slot + 1) + ' ' + state.names[st] + '</span><span class="' + (ok ? 'ok' : 'warn') + '">' + (d >= 0 ? '+' : '') + d.toFixed(1) + ' dB' + (ok ? ' ✓' : '') + '</span></div>';
    }).join('');
    document.getElementById('mbl-mb-list').innerHTML = mbHtml;
    document.getElementById('mbl-mb-spread').textContent = (JA ? 'Spread: 最大差 ' : 'Spread: ') + Math.max(0, maxV - minV).toFixed(1) + ' dB';

    // Snapshots
    for (var s = 0; s < 3; s++) {
      var sb = document.getElementById('mbl-snap-' + s);
      var lbl = ['A', 'B', 'C'][s];
      sb.textContent = state.snapshots[s] ? (lbl + ':' + GENRES[state.snapshots[s].genre].name) : (lbl + (JA ? ':空' : ':Empty'));
      sb.setAttribute('aria-pressed', state.activeSnap === s ? 'true' : 'false');
    }

    // Judge box
    var jb = document.getElementById('mbl-judge-res');
    if (!state.judge) {
      jb.className = 'mbl-judge-box';
      jb.textContent = JA ? '▶ JUDGE / 判定 (5秒)' : 'Press JUDGE (±' + tol + ' dB)';
    } else {
      jb.className = 'mbl-judge-box ' + (state.judge.pass ? 'pass' : 'retry');
      jb.textContent = (state.judge.pass ? 'PASS ' : 'RETRY ') + state.judge.score + (JA ? '点' : ' pts') + '\n' + (JA ? '最大誤差: ' : 'Max err: ') + state.judge.maxErr.toFixed(2) + ' dB';
    }

    // Guide panel content
    var L = LESSONS[state.lessonIdx];
    document.getElementById('mbl-lesson-sel').value = String(state.lessonIdx);
    document.getElementById('mbl-l-badge').textContent = L.badge;
    document.getElementById('mbl-l-title').textContent = JA ? L.titleJa : L.titleEn;
    document.getElementById('mbl-l-body').textContent = JA ? L.bodyJa : L.bodyEn;

    var G = GENRES[state.genre];
    document.getElementById('mbl-g-title').textContent = JA ? G.titleJa : G.titleEn;
    document.getElementById('mbl-g-desk').textContent = 'Console: ' + CONSOLES[G.desk].name;
    document.getElementById('mbl-g-body').textContent = (JA ? G.ja : G.en) + '\n\n' + (JA ? G.whyJa : G.whyEn);

    document.querySelectorAll('#mbl-genre-table tr[data-row]').forEach(function (tr) {
      tr.classList.toggle('active', Number(tr.dataset.row) === state.genre);
    });
  }

  function buildStaticUI() {
    var tb = document.getElementById('mbl-genre-table');
    tb.innerHTML = '<tr><th>Genre</th><th>Kick</th><th>Bass</th><th>Snare</th><th>Vocal</th><th>Desk</th></tr>' +
      GENRES.map(function (g, i) {
        return '<tr data-row="' + i + '"><td>' + g.name + '</td>' +
          g.delta.map(function (v) { return '<td>' + (v >= 0 ? '+' : '') + v.toFixed(1) + '</td>'; }).join('') +
          '<td>' + DESK_SHORT[g.desk - 1] + '</td></tr>';
      }).join('');
    tb.querySelectorAll('tr[data-row]').forEach(function (tr) {
      tr.addEventListener('click', function () { state.genre = Number(tr.dataset.row); state.stage = 1; state.judge = null; syncUI(); });
    });

    var lSel = document.getElementById('mbl-lesson-sel');
    lSel.innerHTML = LESSONS.map(function (L, i) { return '<option value="' + i + '">' + L.badge + ': ' + (JA ? L.titleJa : L.titleEn).slice(0, 22) + '</option>'; }).join('');
  }

  function initEvents() {
    document.getElementById('mbl-play').addEventListener('click', togglePlay);
    document.getElementById('mbl-var').addEventListener('change', function (e) { state.varIdx = Number(e.target.value); if (state.playing) startPlayback(); else syncUI(); });
    document.getElementById('mbl-anchor').addEventListener('change', function (e) { state.anchorIdx = Number(e.target.value); syncUI(); });
    document.getElementById('mbl-console').addEventListener('change', function (e) { state.consoleChoice = Number(e.target.value); syncUI(); });
    document.getElementById('mbl-color').addEventListener('click', function () { state.colorOn = !state.colorOn; syncUI(); });
    document.getElementById('mbl-blind').addEventListener('click', function () { state.blind = !state.blind; syncUI(); });
    document.getElementById('mbl-pre').addEventListener('click', function () { state.postMeter = false; syncUI(); });
    document.getElementById('mbl-post').addEventListener('click', function () { state.postMeter = true; syncUI(); });
    document.getElementById('mbl-reset').addEventListener('click', resetAll);
    document.getElementById('mbl-guide-toggle').addEventListener('click', function () { state.guideOpen = !state.guideOpen; syncUI(); });

    document.querySelectorAll('[data-view]').forEach(function (b) { b.addEventListener('click', function () { state.view = Number(b.dataset.view); syncUI(); }); });
    document.querySelectorAll('[data-stage]').forEach(function (b) { b.addEventListener('click', function () { state.stage = Number(b.dataset.stage); state.judge = null; syncUI(); }); });
    document.querySelectorAll('[data-metric]').forEach(function (b) { b.addEventListener('click', function () { state.metric = Number(b.dataset.metric); state.judge = null; syncUI(); }); });
    document.querySelectorAll('[data-genre]').forEach(function (b) { b.addEventListener('click', function () { state.genre = Number(b.dataset.genre); state.stage = 1; state.judge = null; syncUI(); }); });
    document.querySelectorAll('[data-tol]').forEach(function (b) { b.addEventListener('click', function () { state.tolIdx = Number(b.dataset.tol); state.judge = null; syncUI(); }); });

    document.getElementById('mbl-rand').addEventListener('click', randomizeInput);
    document.getElementById('mbl-autotrim').addEventListener('click', autoTrim);
    document.getElementById('mbl-fader0').addEventListener('click', function () { state.fader = [0, 0, 0, 0]; state.judge = null; syncUI(); });
    document.getElementById('mbl-apply-genre').addEventListener('click', applyGenreFaders);
    document.getElementById('mbl-lmatch').addEventListener('click', function () { state.loudnessMatch = !state.loudnessMatch; syncUI(); });
    document.getElementById('mbl-judge').addEventListener('click', runJudge);
    document.getElementById('mbl-snap-clear').addEventListener('click', function () { state.snapshots = [null, null, null]; state.activeSnap = -1; syncUI(); });
    for (var s = 0; s < 3; s++) (function (idx) { document.getElementById('mbl-snap-' + idx).addEventListener('click', function () { saveOrLoadSnap(idx); }); })(s);

    document.getElementById('mbl-lesson-sel').addEventListener('change', function (e) { applyLesson(Number(e.target.value)); });
    document.getElementById('mbl-l-prev').addEventListener('click', function () { applyLesson(state.lessonIdx - 1); });
    document.getElementById('mbl-l-next').addEventListener('click', function () { applyLesson(state.lessonIdx + 1); });
    document.getElementById('mbl-l-apply').addEventListener('click', function () { applyLesson(state.lessonIdx); });

    for (var slot = 0; slot < 4; slot++) {
      (function (sl) {
        var gEl = document.getElementById('mbl-g-' + sl);
        var fEl = document.getElementById('mbl-f-' + sl);
        var dragK = null, dragF = false;
        gEl.addEventListener('pointerdown', function (e) { e.preventDefault(); var st = state.order[sl]; dragK = { y: e.clientY, v: state.inGain[st] }; try { gEl.setPointerCapture(e.pointerId); } catch (_) {} });
        gEl.addEventListener('pointermove', function (e) { if (!dragK) return; var st = state.order[sl]; state.inGain[st] = Math.round(Math.max(-18, Math.min(18, dragK.v + (dragK.y - e.clientY) * 0.16)) * 10) / 10; state.judge = null; syncUI(); });
        gEl.addEventListener('pointerup', function () { dragK = null; });
        gEl.addEventListener('dblclick', function () { state.inGain[state.order[sl]] = 0; state.judge = null; syncUI(); });
        gEl.addEventListener('wheel', function (e) { e.preventDefault(); var st = state.order[sl]; state.inGain[st] = Math.round(Math.max(-18, Math.min(18, state.inGain[st] + (e.deltaY < 0 ? 0.2 : -0.2))) * 10) / 10; state.judge = null; syncUI(); }, { passive: false });

        function setFaderY(cy) {
          var rect = fEl.getBoundingClientRect(), topY = rect.top + rect.height * 0.08, botY = rect.top + rect.height * 0.92;
          var db = 12 - Math.max(0, Math.min(1, (cy - topY) / Math.max(1, botY - topY))) * 36;
          state.fader[state.order[sl]] = Math.round(db * 10) / 10; state.stage = 1; state.judge = null; syncUI();
        }
        fEl.addEventListener('pointerdown', function (e) { e.preventDefault(); dragF = true; try { fEl.setPointerCapture(e.pointerId); } catch (_) {} setFaderY(e.clientY); });
        fEl.addEventListener('pointermove', function (e) { if (dragF) setFaderY(e.clientY); });
        fEl.addEventListener('pointerup', function () { dragF = false; });
        fEl.addEventListener('dblclick', function () { state.fader[state.order[sl]] = 0; state.stage = 1; state.judge = null; syncUI(); });
        fEl.addEventListener('wheel', function (e) { e.preventDefault(); var st = state.order[sl]; state.fader[st] = Math.round(Math.max(-24, Math.min(12, state.fader[st] + (e.deltaY < 0 ? 0.2 : -0.2))) * 10) / 10; state.stage = 1; state.judge = null; syncUI(); }, { passive: false });

        document.getElementById('mbl-s-' + sl).addEventListener('click', function () { var st = state.order[sl]; state.solo[st] = !state.solo[st]; syncUI(); });
        document.getElementById('mbl-m-' + sl).addEventListener('click', function () { var st = state.order[sl]; state.mute[st] = !state.mute[st]; syncUI(); });
        document.getElementById('mbl-z-' + sl).addEventListener('click', function () { state.fader[state.order[sl]] = 0; state.judge = null; syncUI(); });

        document.getElementById('mbl-swapL-' + sl).addEventListener('click', function () {
          var t = (sl + 3) % 4, tmp = state.order[sl]; state.order[sl] = state.order[t]; state.order[t] = tmp; syncUI();
        });
        document.getElementById('mbl-swapR-' + sl).addEventListener('click', function () {
          var t = (sl + 1) % 4, tmp = state.order[sl]; state.order[sl] = state.order[t]; state.order[t] = tmp; syncUI();
        });
        document.getElementById('mbl-tape-' + sl).addEventListener('click', function () {
          var st = state.order[sl];
          var nv = window.prompt(JA ? 'チャンネル名を変更:' : 'Rename channel:', state.names[st]);
          if (nv && nv.trim()) { state.names[st] = nv.trim().slice(0, 10).toUpperCase(); syncUI(); }
        });
      })(slot);
    }
  }

  var lastT = performance.now();
  function tick(now) {
    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;
    updateReadings(dt);
    drawBridge();
    updateLedMeters();
    requestAnimationFrame(tick);
  }

  buildStaticUI();
  initEvents();
  syncUI();
  requestAnimationFrame(tick);
})();
