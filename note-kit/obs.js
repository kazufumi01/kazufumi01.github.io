/* 「いまの音の変化」: each lab's on-screen readings, turned into plain sentences. Read-only; never changes the lab. */
(function () {
  var Q = function (s) { return document.querySelector(s); };
  var T = function (s) { var e = Q(s); return e ? (e.textContent || '').trim() : ''; };
  var N = function (s) { var t = typeof s === 'string' && s.charAt(0) !== '#' && s.charAt(0) !== '[' && s.charAt(0) !== '.' ? s : T(s);
    t = t.replace(/[−–]/g, '-'); var m = t.match(/-?\d+(\.\d+)?/); if (!m) return NaN; var v = parseFloat(m[0]);
    if (/\d\s*s\b/.test(t) && !/ms/.test(t)) v *= 1000; if (/kHz/.test(t)) v *= 1000; return v; };
  var P = function (s) { var e = Q(s + ' [aria-pressed="true"], ' + s + ' .on'); return e ? e.textContent.trim() : ''; };
  var mn = function (v, d) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(d); };
  var f1 = function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(1); };
  window.NK_OBS = {
    sat: function (ja) {
      var thd = N('#r-thd'), h2 = N('#r-h2'), h3 = N('#r-h3'), eo = N('#r-eo'), os = (Q('#flow') || {}).dataset ? Q('#flow').dataset.os : '', c = T('#shl'), L = [];
      if (isNaN(thd)) return null;
      L.push([ja ? '歪みの量' : 'Amount', 'THD ' + thd.toFixed(1) + ' % — ' + (thd < .5 ? (ja ? 'ほぼ透明。音量感だけが少し変わる程度' : 'almost transparent') : thd < 3 ? (ja ? 'うっすら色付く程度（温かさ・太さ）' : 'a subtle colour (warmth, weight)') : thd < 10 ? (ja ? 'はっきり聴こえる歪み' : 'clearly audible distortion') : (ja ? '強い歪み（ファズ寄り）' : 'heavy distortion, towards fuzz'))]);
      if (!isNaN(eo)) L.push([ja ? '倍音の性格' : 'Character', (ja ? '偶数次 − 奇数次 ' : 'even − odd ') + f1(eo) + ' dB — ' + (eo > 3 ? (ja ? '偶数次が優勢：柔らかく太い（真空管・テープ的）' : 'even-led: soft and thick (tube / tape-like)') : eo < -3 ? (ja ? '奇数次が優勢：硬く前に出る（トランジスタ・クリップ的）' : 'odd-led: hard and forward (transistor / clip-like)') : (ja ? '偶数次と奇数次が混ざる' : 'a mix of even and odd'))]);
      if (!isNaN(h2) && !isNaN(h3)) L.push([ja ? '2次と3次' : '2nd vs 3rd', (ja ? '2次 ' : '2nd ') + mn(h2, 1) + ' dB / ' + (ja ? '3次 ' : '3rd ') + mn(h3, 1) + ' dB' + (c ? (ja ? '（' + c + '）' : ' (' + c + ')') : '')]);
      if (os === '1' && thd > 3) L.push([ja ? '折り返し' : 'Aliasing', ja ? 'オーバーサンプリング ×1 で歪みが強め。高域に倍音と無関係な成分（赤）が出やすい状態です' : 'Oversampling ×1 with strong distortion: unrelated (red) components are likely up high']);
      if (Q('#delta[aria-pressed="true"]')) L.push([ja ? '試聴' : 'Listening', ja ? '差分を聴いています（回路が足した音だけ）' : 'Delta: only what the circuit adds']);
      return L;
    },
    eq: function (ja) {
      var mode = P('#mode'), lat = T('#r-lat'), pre = T('#r-pre'), prel = T('#r-prel'), ag = T('#r-ag'), d = N('#tr-d'), L = [];
      if (!mode) return null;
      L.push([ja ? '方式' : 'Mode', mode + (lat ? (ja ? ' — レイテンシー ' : ' — latency ') + lat : '')]);
      var none = !pre || /なし|none|—/i.test(pre);
      L.push([ja ? 'アタックの前' : 'Before the attack', none ? (ja ? 'プリリンギングなし。音の頭より前には何も出ません' : 'No pre-ringing: nothing comes before the onset') : (ja ? 'プリリンギング ' + pre + '（' + prel + '）— キックやスネアの頭がにじむことがあります' : 'Pre-ringing ' + pre + ' (' + prel + ') — kick and snare onsets can smear')]);
      if (ag) L.push([ja ? '音量' : 'Level', (ja ? '音量補正 ' : 'Gain compensation ') + ag]);
      if (!isNaN(d)) L.push([ja ? '1発の波形' : 'Single hit', (ja ? '差分のレベル ' : 'Difference ') + d.toFixed(1) + ' dB — ' + (d < -30 ? (ja ? '波形はほとんど変わっていない' : 'the waveform barely changes') : d < -15 ? (ja ? '音色が少し変わった程度' : 'a modest tonal change') : (ja ? '波形がはっきり変わっている' : 'the waveform changes clearly'))]);
      return L;
    },
    meter: function (ja) {
      var I = N('#sI'), M = N('#sM'), TP = N('#sTP'), PLR = N('#sPLR'), CF = N('#sCF'), ISP = N('#sISP'), L = [];
      if (isNaN(M)) return [[ja ? '準備' : 'Ready', ja ? '再生すると、各メーターの読みをここで解説します。' : 'Press play and the readings are explained here.']];
      var tgt = NaN; document.querySelectorAll('select').forEach(function (s) { var o = s.options[s.selectedIndex]; if (o && /LUFS|Spotify|YouTube|Apple|EBU|ATSC/i.test(s.textContent) && /−|-/.test(o.text) && isNaN(tgt) && !/dBFS/.test(o.text)) tgt = N(o.text); });
      if (!isNaN(I)) L.push([ja ? 'ラウドネス' : 'Loudness', 'Integrated ' + mn(I, 1) + ' LUFS' + (!isNaN(tgt) ? (ja ? '（目標 ' + mn(tgt, 0) + ' に対して ' + f1(I - tgt) + ' LU）' : ' (target ' + mn(tgt, 0) + ': ' + f1(I - tgt) + ' LU)') : '')]);
      else L.push([ja ? 'ラウドネス' : 'Loudness', 'Momentary ' + mn(M, 1) + ' LUFS']);
      if (!isNaN(TP)) L.push(['True Peak', mn(TP, 1) + ' dBTP — ' + (TP > -1 ? (ja ? '配信の推奨上限 −1 dBTP を超えています' : 'above the −1 dBTP streaming ceiling') : (ja ? '−1 dBTP 以内' : 'within −1 dBTP'))]);
      if (!isNaN(ISP) && ISP > .3) L.push([ja ? 'サンプル間ピーク' : 'Inter-sample peak', (ja ? 'サンプル値より ' : 'True peak is ') + ISP.toFixed(1) + (ja ? ' dB 高い山が再構成で生まれています' : ' dB above the sample peak')]);
      var src = P('#src'), test = /サイン|バースト|インターサンプル|sine|burst|inter/i.test(src);
      if (test) L.push([ja ? '抑揚' : 'Dynamics', ja ? 'テスト信号（' + src + '）なので抑揚の判定はしません。ピンクノイズ・ビート・音声ファイルで見てください' : 'Test signal (' + src + '): no dynamics verdict. Use pink noise, the beat or a file']);
      var pl = !isNaN(PLR) ? PLR : CF; if (!test && !isNaN(pl)) L.push([ja ? '抑揚' : 'Dynamics', (!isNaN(PLR) ? 'PLR ' : 'Crest ') + pl.toFixed(1) + ' — ' + (pl < 8 ? (ja ? '強く圧縮された密度の高い音' : 'heavily compressed, dense') : pl < 12 ? (ja ? 'ポップス・ロックで標準的' : 'typical for pop / rock') : (ja ? '抑揚が大きくダイナミック' : 'wide and dynamic'))]);
      return L;
    },
    reso: function (ja) {
      var v = function (k) { return N('#o_' + k); }, thr = v('thr'), dep = v('depth'), rg = v('range'), at = v('attack'), rl = v('release'), lo = T('#o_lo'), hi = T('#o_hi'), L = [];
      if (isNaN(thr)) return null;
      L.push([ja ? 'どこを削るか' : 'What gets cut', 'Selectivity ' + thr.toFixed(1) + ' dB — ' + (thr < 3 ? (ja ? '低め：小さな突出まで拾い、削る帯域が多い' : 'low: catches small peaks, many bands cut') : thr < 8 ? (ja ? '中程度：目立つ共鳴を中心に削る' : 'medium: mainly the obvious resonances') : (ja ? '高め：大きく飛び出た共鳴だけ' : 'high: only big resonances'))]);
      if (!isNaN(dep)) L.push([ja ? 'どれだけ削るか' : 'How much', 'Depth ' + dep + ' %' + (!isNaN(rg) ? ' / Max GR ' + mn(rg, 1) + ' dB' : '') + ' — ' + (dep < 40 ? (ja ? '軽く整える' : 'gentle') : dep < 75 ? (ja ? 'はっきり抑える' : 'clear control') : (ja ? '強く押し込む（質感が痩せないか注意）' : 'strong — watch for thinning'))]);
      if (!isNaN(at)) L.push([ja ? '速さ' : 'Speed', 'Attack ' + at + ' ms / Release ' + rl + ' ms — ' + (at < 5 ? (ja ? '子音やアタックにも即反応' : 'reacts even to consonants and attacks') : (ja ? '持続する共鳴を中心に反応' : 'mainly sustained resonances'))]);
      if (lo || hi) L.push([ja ? '帯域' : 'Band', lo + ' – ' + hi]);
      if (Q('[data-mon="delta"][aria-pressed="true"]')) L.push([ja ? '試聴' : 'Listening', ja ? 'Delta：削った音だけを聴いています' : 'Delta: only what is removed']);
      return L;
    },
    dbasic: function (ja) {
      var t = N('[data-o="tL"]'), fb = N('[data-o="fb"]'), wet = N('[data-o="wet"]'), lp = N('[data-o="lp"]'), bpm = N((Q('[data-k="bpm"]') || {}).value || ''), mode = P('[data-group="mode"]'), L = [];
      if (isNaN(t)) return null;
      var zone = t < 30 ? (ja ? '融合帯：別の音には聞こえず、厚み・広がりになる' : 'fusion: heard as thickness, not an echo') : t < 60 ? (ja ? '境界：打楽器では分離し始める' : 'border: starts to separate on drums') : t < 160 ? (ja ? 'スラップ：1回返る反射で存在感が出る' : 'slapback: one return adds presence') : (ja ? 'リズムのあるエコー' : 'rhythmic echo');
      L.push([ja ? '時間' : 'Time', Math.round(t) + ' ms — ' + zone + (mode ? '（' + mode + '）' : '')]);
      if (!isNaN(bpm) && bpm > 0) { var q = 60000 / bpm, best = null; [[.25, '16分'], [1 / 3, '8分3連'], [.5, '8分'], [.75, '付点8分'], [2 / 3, '4分3連'], [1, '4分'], [1.5, '付点4分'], [2, '2分']].forEach(function (x) { if (Math.abs(t / (q * x[0]) - 1) < .04) best = x; });
        if (best) L.push([ja ? 'テンポ' : 'Tempo', ja ? 'BPM ' + bpm + ' の' + best[1] + '音符に一致。リズムに溶け込む' : 'Locks to a ' + ({ '16分': '1/16', '8分3連': '1/8T', '8分': '1/8', '付点8分': 'dotted 1/8', '4分3連': '1/4T', '4分': '1/4', '付点4分': 'dotted 1/4', '2分': '1/2' })[best[1]] + ' at ' + bpm + ' BPM']); }
      if (!isNaN(fb)) { var n = fb <= 0 ? 1 : Math.ceil(Math.log(0.001) / Math.log(fb / 100)); L.push([ja ? '繰り返し' : 'Repeats', 'Feedback ' + fb + ' % — ' + (ja ? '約 ' + n + ' 回で −60 dB まで減衰' : 'about ' + n + ' repeats to −60 dB')]); }
      if (!isNaN(lp) && lp < 4500) L.push([ja ? '音色' : 'Tone', ja ? 'ハイカットが低め：リピートするほど暗く奥へ下がる' : 'Low high-cut: each repeat gets darker and further back']);
      if (!isNaN(wet)) L.push([ja ? '量' : 'Level', 'Wet ' + mn(wet, 1) + ' dB — ' + (wet > -6 ? (ja ? 'はっきり聞こえる効果' : 'clearly audible') : wet < -15 ? (ja ? '隠し味（ミュートすると違いが分かる程度）' : 'a hidden layer') : (ja ? '自然になじむ量' : 'blends naturally'))]);
      return L;
    },
    danalog: function (ja) {
      var name = T('[data-el="name"]'), t = N('[data-o="time"]'), fb = N('[data-o="fb"]'), dr = N('[data-o="drive"]'), lp = N('[data-o="lp"]'), wow = N('[data-o="wow"]'), fl = N('[data-o="flutter"]'), L = [];
      if (isNaN(t)) return null;
      L.push([ja ? '機種' : 'Machine', name + ' — ' + Math.round(t) + ' ms']);
      if (!isNaN(fb)) L.push([ja ? '繰り返し' : 'Repeats', 'Feedback ' + fb + ' % — ' + (fb >= 90 ? (ja ? '発振寸前。リピートが積み重なって音が育つ' : 'near self-oscillation; repeats build up') : fb >= 50 ? (ja ? '長く残るエコー' : 'long-lasting echoes') : (ja ? '数回で消える' : 'fades after a few repeats'))]);
      if (!isNaN(dr)) L.push([ja ? '飽和' : 'Saturation', 'Drive ' + dr + ' % — ' + (dr > 50 ? (ja ? '繰り返すほど丸く歪んでいく' : 'repeats get rounder and more distorted') : (ja ? '控えめな飽和' : 'mild saturation'))]);
      if (!isNaN(lp)) L.push([ja ? '音色' : 'Tone', 'Tone ' + (lp >= 1000 ? (lp / 1000).toFixed(1) + ' kHz' : Math.round(lp) + ' Hz') + ' — ' + (lp < 4000 ? (ja ? '暗く、リピートが奥へ消えていく' : 'dark; repeats fade into the distance') : (ja ? '明るめ' : 'fairly bright'))]);
      if ((wow || 0) + (fl || 0) > 25) L.push([ja ? '揺れ' : 'Wobble', ja ? 'Wow/Flutter が多め：ピッチが揺れてテープ・機械らしさが出る' : 'Plenty of wow/flutter: pitch wobble gives the tape-machine feel']);
      return L;
    },
    er: function (ja) {
      var m = {}; document.querySelectorAll('#stats dt').forEach(function (dt) { var dd = dt.nextElementSibling; if (dd) m[dt.textContent.trim()] = dd.textContent.trim(); });
      var get = function (re) { for (var k in m) if (re.test(k)) return m[k]; return ''; };
      var L = [], itdg = N(get(/ITDG/)), dr = N(get(/D\/R/)), single = !!Q('#modeSeg [data-v="single"][aria-pressed="true"]');
      if (single) { var d = N(get(/^遅延$|^Delay$/)); if (isNaN(d)) return null;
        L.push([ja ? '単一反射' : 'Single reflection', d.toFixed(1) + ' ms — ' + (d < 1.5 ? (ja ? '音色が変わる（コムフィルター）' : 'tone colour (comb filtering)') : d < 30 ? (ja ? '直接音と融合して太く・広くなる' : 'fuses: thicker and wider') : d < 50 ? (ja ? '素材によって分離し始める' : 'starts to separate, depending on material') : (ja ? 'エコーとして分離して聞こえる' : 'heard as a separate echo'))]); return L; }
      if (isNaN(itdg)) return null;
      L.push([ja ? '部屋の大きさ' : 'Room size', 'ITDG ' + itdg.toFixed(1) + ' ms — ' + (itdg < 4 ? (ja ? '極小空間：狭く近い' : 'very small: tight and close') : itdg < 10 ? (ja ? '小〜中部屋：録った部屋の実在感' : 'small to medium room') : itdg < 20 ? (ja ? '大部屋・ライブスペース' : 'large room / live space') : (ja ? 'ホール級の広さ' : 'hall-sized'))]);
      if (!isNaN(dr)) L.push([ja ? '距離感' : 'Distance', 'D/R ' + f1(dr) + ' dB — ' + (dr > 3 ? (ja ? '近く、輪郭がはっきり' : 'close and defined') : dr > -3 ? (ja ? '中くらいの距離' : 'middle distance') : (ja ? '奥に下がって聞こえる' : 'pushed back'))]);
      var hf = N('#o_hf') ; return L;
    }
  };
})();
