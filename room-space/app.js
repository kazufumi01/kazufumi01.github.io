(() => {
  "use strict";

  const SR = 48000;
  const IR_SECONDS = 2.5;
  const C = 343;
  const BANDS = [125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const surfaceNames = ["floor", "ceiling", "west", "east", "south", "north"];
  const surfaceLabels = { floor: "Floor", ceiling: "Ceiling", west: "West wall", east: "East wall", south: "South wall", north: "North wall" };
  const surfaceLabelsJa = { floor: "床", ceiling: "天井", west: "西壁", east: "東壁", south: "南壁", north: "北壁" };
  const materials = {
    concrete: { name: "Concrete", alpha: [.02,.02,.03,.03,.04,.05,.06,.08], scatter: [.02,.02,.03,.04,.06,.08,.1,.12] },
    plaster: { name: "Plaster", alpha: [.12,.1,.08,.06,.05,.04,.04,.04], scatter: [.04,.04,.05,.06,.08,.1,.12,.14] },
    wood: { name: "Wood", alpha: [.15,.11,.1,.08,.08,.08,.08,.08], scatter: [.08,.08,.1,.12,.15,.18,.2,.22] },
    glass: { name: "Glass", alpha: [.18,.06,.04,.03,.02,.02,.02,.02], scatter: [.01,.01,.02,.02,.03,.04,.05,.06] },
    curtain: { name: "Curtain", alpha: [.08,.15,.35,.55,.65,.72,.75,.75], scatter: [.08,.1,.14,.2,.28,.34,.38,.4] },
    carpet: { name: "Carpet", alpha: [.02,.06,.14,.37,.6,.65,.7,.7], scatter: [.1,.12,.16,.2,.22,.24,.26,.28] },
    panel: { name: "Absorber", alpha: [.18,.45,.8,.92,.95,.95,.95,.95], scatter: [.12,.18,.25,.32,.38,.42,.45,.48] },
    audience: { name: "Audience", alpha: [.25,.4,.55,.7,.78,.82,.82,.82], scatter: [.16,.2,.24,.3,.35,.4,.42,.44] }
  };
  const objectCatalog = {
    sofa: { name:"Sofa", nameJa:"ソファ", size:[2.0,.9,.85], color:"#b38f66", alpha:[.08,.14,.28,.42,.52,.58,.6,.6], scatter:[.35,.38,.4,.42,.45,.48,.5,.52] },
    bed: { name:"Bed", nameJa:"ベッド", size:[2.0,2.0,.62], color:"#9b866a", alpha:[.12,.2,.34,.5,.6,.66,.68,.68], scatter:[.28,.32,.36,.4,.44,.47,.5,.52] },
    bookcase: { name:"Bookcase", nameJa:"本棚", size:[1.2,.38,2.0], color:"#8e7251", alpha:[.08,.1,.12,.16,.2,.22,.24,.25], scatter:[.4,.45,.5,.54,.58,.62,.65,.67] },
    wardrobe: { name:"Wardrobe", nameJa:"ワードローブ", size:[1.2,.62,2.1], color:"#a17d58", alpha:[.08,.1,.12,.14,.15,.16,.17,.18], scatter:[.18,.2,.22,.24,.26,.28,.3,.32] },
    clothes: { name:"Clothes rack", nameJa:"衣類ラック", size:[1.4,.55,1.65], color:"#7b9d91", alpha:[.1,.22,.4,.62,.72,.76,.78,.78], scatter:[.28,.34,.4,.46,.5,.54,.56,.58] },
    curtain: { name:"Curtain", nameJa:"カーテン", size:[1.8,.08,2.4], color:"#8a82b3", alpha:[.08,.16,.34,.55,.68,.74,.76,.76], scatter:[.12,.16,.2,.25,.3,.34,.38,.4] },
    rug: { name:"Rug", nameJa:"ラグ", size:[2.0,1.5,.04], color:"#987b72", alpha:[.02,.05,.14,.38,.62,.68,.72,.72], scatter:[.12,.15,.18,.22,.25,.28,.3,.32] },
    desk: { name:"Desk", nameJa:"机", size:[1.4,.7,.75], color:"#aa966f", alpha:[.06,.08,.1,.12,.14,.15,.16,.16], scatter:[.3,.34,.38,.42,.45,.48,.5,.52] },
    absorber: { name:"Absorber board", nameJa:"吸音ボード", size:[1.2,.08,1], color:"#568c7e", wall:"north", alpha:[.18,.45,.8,.92,.95,.95,.95,.95], scatter:[.08,.12,.18,.22,.25,.28,.3,.32] },
    diffuser: { name:"Diffuser panel", nameJa:"乱反射板", size:[1.2,.12,1], color:"#9475a8", wall:"north", alpha:[.04,.05,.07,.09,.12,.16,.2,.24], scatter:[.25,.45,.68,.82,.88,.88,.85,.82] },
    windowOpen: { name:"Open window", nameJa:"開放窓", size:[1,.08,.9], color:"#527d91", wall:"north", opening:true, alpha:[.98,.98,.98,.98,.98,.98,.98,.98], scatter:[0,0,0,0,0,0,0,0] },
    windowGlass: { name:"Glass window", nameJa:"ガラス窓", size:[1,.08,.9], color:"#6cabc1", wall:"north", alpha:[.18,.06,.04,.03,.02,.02,.02,.02], scatter:[.01,.01,.02,.02,.03,.04,.05,.06] },
    plant: { name:"Houseplant", nameJa:"観葉植物", size:[.65,.65,1.4], color:"#668e62", alpha:[.12,.2,.3,.4,.48,.52,.54,.54], scatter:[.55,.62,.68,.72,.75,.76,.78,.78] },
    cushion: { name:"Cushion", nameJa:"クッション", size:[.55,.55,.18], color:"#c08071", alpha:[.12,.22,.42,.62,.72,.76,.78,.78], scatter:[.18,.22,.28,.32,.36,.38,.4,.4] },
    diningTable: { name:"Dining table", nameJa:"ダイニングテーブル", size:[1.5,.85,.75], color:"#a88c68", alpha:[.04,.06,.08,.1,.12,.13,.14,.14], scatter:[.25,.28,.32,.36,.4,.42,.44,.45] },
    cabinet: { name:"Kitchen cabinet", nameJa:"キッチン収納", size:[1.5,.55,2], color:"#8c7860", alpha:[.08,.1,.12,.14,.16,.18,.2,.2], scatter:[.18,.2,.24,.28,.32,.34,.36,.38] }
  };

  let state = defaultState();
  let latest = null;
  let audioContext = null;
  let activeSource = null;
  let loopPlayback = false;
  let suppressLoop = false;
  let sampleAudio = null;
  let sampleSource = null;
  let directConvolver = null;
  let reverbConvolver = null;
  let directGainNode = null;
  let reverbGainNode = null;
  let auditionCompressor = null;
  let underwaterHighpass = null;
  let underwaterLowpass = null;
  let snapshots = [null,null,null,null];
  let nextSnapshotSlot = 0;
  let toastTimer = 0;
  let dragging = null;
  let dirty = true;
  let language = "en";
  const jaText = {
    "LOCAL SESSION":"ローカルセッション", "Open":"開く", "Save scene":"シーン保存", "Export RIR":"RIRを書き出す", "SCENE SETUP":"シーン設定", "ROOM DIMENSIONS":"部屋の寸法", "METRES":"メートル", "WIDTH":"幅", "DEPTH":"奥行", "HEIGHT":"高さ", "SURFACES":"面", "6 PLANES":"6面", "FURNITURE & OBJECTS":"家具・物体", "+ ADD":"＋追加", "No objects in this room":"この部屋に物体はありません", "Box approximation for placement and path blocking. Not a 3D mesh solver.":"配置と音の経路遮蔽を箱で近似します。3Dメッシュによる計算ではありません。", "SOLVER":"計算設定", "Image-source order":"像音源法の反射次数", "FAST":"高速", "HIGHER DETAIL":"高精細", "Modal analysis limit":"モード解析の上限", "Material values are illustrative starting points. Replace them with measured data when available.":"素材値は初期設定用の参考値です。測定値があれば置き換えてください。", "Scene data stays in this browser":"シーンデータはこのブラウザー内に保存されます", "No account or upload required":"アカウント不要・アップロードなし", "ROOM ACOUSTICS":"室内音響", "REFERENCE MODEL":"参照モデル", "Build a room. Place the mic.":"部屋を作り、マイクを置く", "Explore how geometry and surface absorption shape the impulse response.":"形状と表面の吸音がインパルス応答に与える影響を確認できます。", "Reset scene":"シーンをリセット", "Save A/B":"A/B比較を保存", "Workspace views":"作業ビュー", "ROOM":"部屋", "PLACEMENT":"配置", "RESPONSE":"応答", "READY TO SIMULATE":"計算できます", "PLAN VIEW":"平面図", "Room & placement":"部屋と配置", "SOURCE":"音源", "MICROPHONE":"マイク", "REFLECTION PATH":"反射経路", "DRAG":"ドラッグ", "source or microphone to reposition":"音源またはマイクを移動", "IMPULSE RESPONSE":"インパルス応答", "Early energy over time":"初期エネルギーの時間変化", "ENERGY":"エネルギー", "SOURCE / RECEIVER":"音源／受音点", "Position and distance":"位置と距離", "TOP VIEW · Z-UP":"平面図・Z軸上向き", "handles or use numeric coordinates":"ハンドルまたは数値で座標を指定", "DISTANCE —":"距離 —", "ROOM RESPONSE":"室内応答", "Frequency and decay":"周波数と減衰", "MODE DENSITY":"モード密度", "DECAY ESTIMATE":"減衰の推定", "Sabine reference T60":"Sabine式のT60参考値", "DIFFUSE-FIELD APPROXIMATION":"拡散音場近似", "RIR PREVIEW":"RIRプレビュー", "PLAY GENERATED RESPONSE":"生成した応答を再生", "SIMULATE ROOM":"室内を計算", "OMNIDIRECTIONAL":"無指向性", "DIRECTIONAL":"指向性", "SELECTED · BOX APPROXIMATION":"選択中・箱形状で近似", "ROTATION":"平面回転", "ROOM METRICS":"部屋の指標", "LIVE":"更新中", "VOLUME":"容積", "SOURCE → MIC":"音源 → マイク", "DIRECT ARRIVAL":"直接音の到達", "IMAGE PATHS":"像音源経路", "EST. RT60 @ 1 kHz":"推定RT60（1 kHz）", "ESTIMATE":"推定", "Sabine diffuse-field reference":"Sabine式・拡散音場の参考値", "SCENE A / B":"シーン A / B", "Clear":"消去", "Save a snapshot to compare":"スナップショットを保存して", "two room setups.":"2つの部屋を比較します。", "Concrete":"コンクリート", "Plaster":"しっくい", "Wood":"木材", "Glass":"ガラス", "Curtain":"カーテン", "Carpet":"カーペット", "Absorber":"吸音材", "Audience":"客席", "Floor":"床", "Ceiling":"天井", "West wall":"西壁", "East wall":"東壁", "South wall":"南壁", "North wall":"北壁", "Sofa":"ソファ", "Bed":"ベッド", "Bookcase":"本棚", "Wardrobe":"ワードローブ", "Clothes rack":"衣類ラック", "Rug":"ラグ", "Desk":"机", "ROTATION":"平面回転", "WIDTH":"幅", "DEPTH":"奥行", "HEIGHT":"高さ", "Conversation · Japanese":"会話・日本語", "Conversation · English":"会話・英語", "Impulse response":"インパルス応答", "AZIMUTH":"方位角", "BEAM WIDTH":"指向幅", "Azimuth 0° points toward +Y (top of plan). Beam width is the full angle at −6 dB; 360° is omnidirectional. Directionality changes image-path levels, not room-mode frequencies.":"方位角0°は平面図の上（+Y方向）です。指向幅は−6 dBにおける全角で、360°は無指向性です。指向性は像音源経路の音量に反映され、室内モード周波数は変わりません。"
  };
  const enText = Object.fromEntries(Object.entries(jaText).map(([en,ja])=>[ja,en]));
  Object.assign(jaText,{"DIRECT SOUND":"直接音","REVERB":"残響音","DIRECT":"直接音","Clear all":"すべて消去","S/M to move · arrow tip to turn · selected furniture knob to rotate":"S/Mをドラッグして移動・矢印の先端をドラッグして向きを変更・選択した家具のつまみで回転","Azimuth 0° points toward +Y (top of plan). Beam width is the full angle at −6 dB; 360° is omnidirectional. Directionality changes image-path levels, not room-mode frequencies.":"方位角0°は平面図の上（+Y方向）です。指向幅は−6 dBにおける全角で、360°は無指向性です。指向性は像音源経路の音量に反映され、室内モード周波数は変わりません。"});
  Object.assign(enText,{"直接音":"DIRECT SOUND","残響音":"REVERB","すべて消去":"Clear all","S/Mをドラッグして移動・矢印の先端をドラッグして向きを変更・選択した家具のつまみで回転":"S/M to move · arrow tip to turn · selected furniture knob to rotate","方位角0°は平面図の上（+Y方向）です。指向幅は−6 dBにおける全角で、360°は無指向性です。指向性は像音源経路の音量に反映され、室内モード周波数は変わりません。":"Azimuth 0° points toward +Y (top of plan). Beam width is the full angle at −6 dB; 360° is omnidirectional. Directionality changes image-path levels, not room-mode frequencies."});
  Object.assign(jaText,{"Room preset":"部屋プリセット","Custom room":"カスタム","Living room":"リビング","Bedroom":"寝室","Kitchen":"キッチン","Bathroom":"浴室","Japanese room":"和室","ROOM PRESET & SHAPE":"部屋プリセット・形状","Plan shape":"平面形状","Rectangular":"長方形","L-shaped":"L字型","Propagation medium":"伝搬媒質","PROPAGATION MEDIUM":"伝搬媒質","Air · 343 m/s":"空気・343 m/s","Helium · 1,007 m/s":"ヘリウム・1,007 m/s","Water · 1,480 m/s":"水・1,480 m/s","Uniform flow X":"一様流 X","Uniform flow Y":"一様流 Y","Stereo pair":"ステレオマイク","Spacing":"間隔","Absorber board":"吸音ボード","Diffuser panel":"乱反射板","Open window":"開放窓","Glass window":"ガラス窓","Houseplant":"観葉植物","Cushion":"クッション","Dining table":"ダイニングテーブル","Cabinet":"収納棚","Sofa":"ソファ","Bed":"ベッド","Bookcase":"本棚","Wardrobe":"ワードローブ","Clothes rack":"衣類ラック","Curtain":"カーテン","Rug":"ラグ","Desk":"机","Object to add":"追加する物体","Add":"追加","Uniform flow only adjusts travel time; no refraction or turbulence. Material coefficients remain illustrative, based on air.":"流れは到達時間だけを一様近似で補正します。屈折・乱流は計算せず、素材値も空気中の参考値です。","An L-shaped outline with approximate blocking; modes still use the bounding rectangle.":"L字形の外形と簡易遮蔽を表示します。モード解析は外接長方形で近似します。","Stereo uses two spaced point receivers; it is not a binaural head model.":"間隔を設けた2点の受音でステレオ化します。頭部・耳介の立体聴覚モデルではありません。"});
  Object.assign(jaText,{"UNDERWATER COMMUNICATION DEMO":"水中通話デモ","Underwater call demo":"水中通話デモを有効にする","Applies water sound speed and a band-limited hydrophone/communication-device color to conversation playback. This is a listening illustration, not a diver or underwater propagation simulator.":"会話試聴に水中の音速と、ハイドロフォン／通話装置を模した帯域制限を適用します。試聴用の音響イメージであり、ダイバーの発声や水中伝搬を完全に再現するものではありません。","WHAT CHANGES IN THE SOUND?":"操作すると音はどう変わる？","Choose a control":"パラメーターを選んでください","Move or focus a parameter to see how it changes the sound.":"項目を操作すると、音への影響をここに表示します。","EXPLANATION":"説明","PLAYBACK":"再生","Press Space to play or stop the selected sample. Enable Loop to repeat it.":"スペースキーで選択中の音源を再生／停止します。「ループ」をオンにすると繰り返し再生します。","Keyboard shortcuts are inactive while editing a field.":"入力欄や選択欄を操作中はショートカットは働きません。","HOW TO READ THE RESPONSE":"応答の見方","Direct sound arrives first. Wall reflections follow, then the room’s diffuse decay.":"最初に直接音が届き、その後に壁の反射音、最後に部屋全体の残響が続きます。","Use the direct/reverb slider to compare the dry voice with the room-colored voice.":"直接音／残響音のスライダーで、響きのない声と部屋の響きを含む声を比べられます。","MODEL NOTE":"モデルについて","Levels and decay are approximate. Listen for relative changes when moving controls; this is not a calibrated room measurement.":"音量と減衰は近似です。測定値ではなく、設定を変えたときの相対的な違いを試聴してください。","Loop playback":"ループ再生","LOOP":"ループ"});
  Object.assign(enText,Object.fromEntries(Object.entries(jaText).map(([en,ja])=>[ja,en])));
  function tr(text){return language==="ja"?(jaText[text]||text):text;}
  function surfaceLabel(id){return language==="ja"?surfaceLabelsJa[id]:surfaceLabels[id];}
  function objectName(o){return language==="ja"?(objectCatalog[o.type]?.nameJa||o.name):o.name;}
  function setLanguage(next){
    const target=next==="ja"?"ja":"en"; if(target===language)return;
    const from=language==="en"?jaText:enText; language=target;
    document.documentElement.lang=language; try{localStorage.setItem("roomSpaceLanguage",language);}catch(_e){}
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){const raw=node.nodeValue,trim=raw.trim();if(from[trim])node.nodeValue=raw.replace(trim,from[trim]);}
    document.title=language==="ja"?"Room / Space — 音響モデリング":"Room / Space — Acoustic Modeling";
    el("playBtn").setAttribute("aria-label",language==="ja"?"サンプルを部屋に通して再生":"Play sample through room");
    el("stopBtn").setAttribute("aria-label",language==="ja"?"再生を停止":"Stop playback");
    el("directBalance").title=language==="ja"?"左端は残響音のみ、右端は直接音のみです。":"Left is reverberant sound only; right is direct sound only.";
    initSurfaceControls();syncControls();drawAll();
    updateSampleReadout();
    updateDirectBalance();updateParameterGuide();updateSnapshotButton();renderSnapshot();
  }

  function defaultState() {
    return {
      title: "Untitled room", dimensions: { x: 6, y: 8, z: 3 }, shape:"rect", underwaterDemo:false,
      source: { x: 3, y: 2, z: 1.5, azimuthDeg: 0, beamWidthDeg: 360 }, receiver: { x: 3, y: 6, z: 1.5, azimuthDeg: 180, beamWidthDeg: 360, stereoEnabled:true, spacing:.2 },
      surfaces: { floor: "wood", ceiling: "plaster", west: "concrete", east: "concrete", south: "concrete", north: "concrete" },
      objects: [], selectedObjectId: null,
      order: 4, modeLimit: 250
    };
  }

  function el(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmt(v, digits = 2) { return Number(v).toFixed(digits); }

  function initSurfaceControls() {
    const list = el("surfaceList");
    list.innerHTML = "";
    for (const id of surfaceNames) {
      const row = document.createElement("label");
      row.className = "surface-row";
      row.dataset.surface = id;
      const swatch = document.createElement("i"); swatch.className = "surface-swatch";
      const name = document.createElement("span"); name.textContent = surfaceLabel(id);
      const select = document.createElement("select"); select.setAttribute("aria-label", surfaceLabel(id) + (language==="ja"?"の素材":" material"));
      for (const [key, material] of Object.entries(materials)) {
        const opt = document.createElement("option"); opt.value = key; opt.textContent = tr(material.name); select.appendChild(opt);
      }
      select.value = state.surfaces[id];
      select.addEventListener("change", () => { state.surfaces[id] = select.value; updateAll(); updateParameterGuide("surface"); });
      row.append(swatch, name, select); list.appendChild(row);
    }
  }

  function bindNumeric(id, onChange) {
    const input = el(id);
    input.addEventListener("change", () => { onChange(Number(input.value)); updateAll(); });
    input.addEventListener("keydown", e => { if (e.key === "Enter") input.blur(); });
  }

  function bindRange(id, onChange) {
    el(id).addEventListener("input", () => { onChange(Number(el(id).value)); updateAll(); });
  }

  function bindControls() {
    for (const [axis, id, min, max] of [["x","dimX",2,30],["y","dimY",2,40],["z","dimZ",2,12]]) {
      bindNumeric(id, v => { state.dimensions[axis] = clamp(v || min, min, max); });
    }
    for (const [kind, axis] of [["source","x"],["source","y"],["source","z"],["receiver","x"],["receiver","y"],["receiver","z"]]) {
      const id = kind === "source" ? "src" + axis.toUpperCase() : "mic" + axis.toUpperCase();
      bindNumeric(id, v => { state[kind][axis] = v; });
      if (axis !== "z") {
        const rid = id + "Range";
        bindRange(rid, v => { state[kind][axis] = v; });
      }
    }
    for(const [kind,prefix] of [["source","src"],["receiver","mic"]]){
      bindRange(prefix+"Azimuth",v=>{state[kind].azimuthDeg=v;});
      bindRange(prefix+"BeamWidth",v=>{state[kind].beamWidthDeg=v;});
    }
    el("roomShape").addEventListener("change",()=>{state.shape=el("roomShape").value;clampPositions();clampObjects();updateAll();});
    el("roomPreset").addEventListener("change",()=>{if(el("roomPreset").value!=="custom")applyRoomPreset(el("roomPreset").value);});
    el("underwaterDemo").addEventListener("change",()=>{state.underwaterDemo=el("underwaterDemo").checked;updateAll();simulate(false);applyUnderwaterTone();updateParameterGuide("underwaterDemo");updateSampleReadout();});
    el("micStereoEnabled").addEventListener("change",()=>{state.receiver.stereoEnabled=el("micStereoEnabled").checked;updateAll();});
    bindRange("micSpacing",v=>{state.receiver.spacing=v;});
    bindRange("reflectionOrder", v => { state.order = v; el("orderValue").textContent = String(v); });
    bindRange("modeLimit", v => { state.modeLimit = v; el("modeValue").textContent = v + " Hz"; });
    el("simulateBtn").addEventListener("click", () => simulate(true));
    el("playBtn").addEventListener("click", togglePlayback);
    el("stopBtn").addEventListener("click", stopPreview);
    el("loopPlayback").addEventListener("change",()=>{loopPlayback=el("loopPlayback").checked;if(sampleAudio)sampleAudio.loop=loopPlayback;});
    el("exportBtn").addEventListener("click", exportRir);
    el("saveSceneBtn").addEventListener("click", saveScene);
    el("loadSceneBtn").addEventListener("click", () => el("loadSceneInput").click());
    el("loadSceneInput").addEventListener("change", loadScene);
    el("resetBtn").addEventListener("click", resetScene);
    el("snapshotBtn").addEventListener("click", saveSnapshot);
    el("clearCompare").addEventListener("click", clearSnapshot);
    el("addObjectBtn").addEventListener("click", addObject);
    el("deleteObjectBtn").addEventListener("click", deleteSelectedObject);
    el("languageSelect").addEventListener("change",()=>setLanguage(el("languageSelect").value));
    el("sampleSelect").addEventListener("change",updateSampleReadout);
    el("directBalance").addEventListener("input",updateDirectBalance);
    document.addEventListener("focusin",e=>{if(e.target?.id)updateParameterGuide(e.target.id);else if(e.target?.closest?.(".surface-row"))updateParameterGuide("surface");});
    document.addEventListener("input",e=>{if(e.target?.id)updateParameterGuide(e.target.id);});
    document.addEventListener("change",e=>{if(e.target?.id)updateParameterGuide(e.target.id);});
    document.addEventListener("keydown",e=>{if(e.code!=="Space"||e.repeat)return;const target=e.target;if(target?.closest?.("input,textarea,select,button,a,[contenteditable='true'],[role='button']"))return;e.preventDefault();togglePlayback();});
    for(const [id,key] of [["objX","x"],["objY","y"],["objZ","z"],["objW","w"],["objD","d"],["objH","h"],["objRot","rotation"]]){
      el(id).addEventListener("change",()=>{const object=getSelectedObject();if(!object)return;const value=Number(el(id).value);if(!Number.isFinite(value))return;if(key==="x"||key==="y"||key==="z")object.position[key]=value;else if(key==="rotation"){object.rotationDeg=((value%360)+360)%360;if(object.rotationDeg>180)object.rotationDeg-=360;}else object.size[key==="w"?0:key==="d"?1:2]=Math.max(.04,value);updateAll();});
    }
    document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => switchView(tab.dataset.view)));
    el("sceneTitle").addEventListener("click", editTitle);
    window.addEventListener("resize", () => drawAll());
  }

  function editTitle() {
    const value = window.prompt("Name this room", state.title);
    if (value && value.trim()) { state.title = value.trim().slice(0, 60); el("sceneTitle").textContent = state.title; }
  }

  function switchView(view) {
    document.querySelectorAll(".tab").forEach(tab => {
      const active = tab.dataset.view === view;
      tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".view-panel").forEach(panel => panel.classList.remove("active-view"));
    el(view + "View").classList.add("active-view");
    requestAnimationFrame(drawAll);
  }

  function normalizedScene() {
    const materialsBySurface = {};
    for (const id of surfaceNames) {
      const m = materials[state.surfaces[id]];
      materialsBySurface[id] = {
        id: state.surfaces[id], name: m.name, bandHz: BANDS,
        absorption: m.alpha, scattering: m.scatter,
        source: m.source || "illustrative-starting-value", confidence: m.confidence ?? 0.2
      };
    }
    return {
      formatVersion: 1, sceneId: "room-space-local", title: state.title,
      lengthUnit: "m", coordinateSystem: "right-handed-z-up", speedOfSoundMps: soundSpeed(),
      room: { dimensions: { ...state.dimensions }, shape:state.shape||"rect", surfaces: materialsBySurface,
        objects: state.objects.map(o=>({id:o.id,type:o.type,position:{...o.position},dimensions:{x:o.size[0],y:o.size[1],z:o.size[2]},rotationDegrees:o.rotationDeg||0,material:{id:`${o.type}-object-material`,name:o.name,bandHz:BANDS,absorption:o.absorption,scattering:o.scattering,source:"illustrative-object-model",confidence:.2}})) },
      source: pointData(state.source), receiver: pointData(state.receiver)
    };
  }

  function pointData(point){const a=(point.azimuthDeg||0)*Math.PI/180,width=point.beamWidthDeg??360;return {position:{x:point.x,y:point.y,z:point.z},forward:{x:Math.sin(a),y:Math.cos(a),z:0},directivity:width>=359.5?"omni":"directional",beamWidthDegrees:width,...(point.stereoEnabled===undefined?{}:{stereo:{enabled:point.stereoEnabled,spacingMeters:point.spacing??.2}})};}
  function soundSpeed(){return state.underwaterDemo?1480:343;}
  function flowAdjustedSpeed(vector){return soundSpeed();}
  function applyUnderwaterTone(){if(!underwaterHighpass||!underwaterLowpass||!audioContext)return;underwaterHighpass.frequency.setTargetAtTime(state.underwaterDemo?260:20,audioContext.currentTime,.04);underwaterLowpass.frequency.setTargetAtTime(state.underwaterDemo?3600:18000,audioContext.currentTime,.04);underwaterHighpass.Q.value=.707;underwaterLowpass.Q.value=.707;}
  function updateParameterGuide(id=""){const title=el("parameterGuideTitle"),text=el("parameterGuideText");if(!title||!text)return;const ja=language==="ja",guide={dimX:["Room width","Width changes left-right reflections and the room’s horizontal resonances.","部屋の幅を広げると左右壁までの距離と横方向の共鳴が変わります。"],dimY:["Room depth","Depth changes front-back reflection timing and lengthwise resonances.","部屋の奥行を変えると前後の反射時刻と縦方向の共鳴が変わります。"],dimZ:["Ceiling height","Height changes floor/ceiling reflection timing and vertical resonances.","天井高を変えると床・天井の反射時刻と上下方向の共鳴が変わります。"],srcX:["Source position","Moving the source changes direct distance, arrival time, and which reflections reach the mic.","音源を動かすと直接音の距離・到達時刻と、マイクに届く反射音が変わります。"],srcY:["Source position","Moving the source changes direct distance, arrival time, and which reflections reach the mic.","音源を動かすと直接音の距離・到達時刻と、マイクに届く反射音が変わります。"],micX:["Microphone position","Moving the mic changes direct level, arrival time, and the balance of early reflections.","マイクを動かすと直接音のレベル・到達時刻と初期反射のバランスが変わります。"],micY:["Microphone position","Moving the mic changes direct level, arrival time, and the balance of early reflections.","マイクを動かすと直接音のレベル・到達時刻と初期反射のバランスが変わります。"],srcAzimuth:["Source direction","Turning the source changes how strongly it sends sound toward the mic and reflecting walls.","音源の向きを変えると、マイクや壁へ向かう音の強さが変わります。"],micAzimuth:["Microphone direction","Turning the mic changes how strongly it receives the direct sound and reflections.","マイクの向きを変えると、直接音と反射音を拾う強さが変わります。"],srcBeamWidth:["Source beam width","A narrower beam sends less sound outside its forward direction; 360° is even in all directions.","指向幅を狭めると正面以外へ出る音が弱くなります。360°は全方向同じです。"],micBeamWidth:["Microphone beam width","A narrower beam rejects more off-axis arrivals, changing the reflected/direct balance.","指向幅を狭めると軸外からの音を拾いにくくなり、反射音と直接音の比率が変わります。"],directBalance:["Direct / reverb balance","The slider crossfades between the dry direct path and the room’s reverberant path.","スライダーで、残響を通さない直接音と、部屋の響きを通した音を切り替えます。"],reflectionOrder:["Reflection order","Higher order adds later, weaker wall bounces. It makes the response denser and takes longer to calculate.","次数を上げると遅れて届く弱い反射が増え、響きが密になります。計算時間も増えます。"],modeLimit:["Mode analysis limit","This sets the highest room resonance shown. It changes the analysis display, not the sample’s bandwidth.","表示する室内共鳴の上限です。解析表示が変わり、音源の帯域を制限する設定ではありません。"],micSpacing:["Stereo spacing","Wider spacing makes left and right receive points more different, increasing stereo spread.","間隔を広げると左右の受音位置の差が増え、ステレオの広がりが変わります。"],underwaterDemo:["Underwater call demo","Water’s sound speed shortens travel times; a band-limited device tone makes speech more muffled. The model omits real water boundaries and hydrophone response.","水中の音速で到達時間が短くなり、帯域制限で声がこもった音になります。水面・水槽の境界や実機のハイドロフォン特性は再現しません。"]};let item=guide[id];if(id==="surface")item=["Surface material","More absorption shortens the decay and weakens reflections; the frequency pattern depends on the chosen material.","吸音率が高い素材ほど残響が短くなり、反射音も弱まります。周波数ごとの効き方は素材で異なります。"];if(id==="roomShape")item=["Room shape","The L-shaped cutout blocks some image paths; the mode analysis remains a rectangular approximation.","L字の欠けた部分で一部の経路を弱めます。モード解析は長方形の近似です。"];if(id==="roomPreset")item=["Room preset","A preset loads a typical room size, surface set, and furniture layout as a starting scene.","プリセットは部屋寸法・壁の素材・家具配置をまとめて初期配置します。"];if(id==="sampleSelect")item=["Sample choice","Conversation samples reveal how the direct path and room response color speech; the impulse option plays the response itself.","会話サンプルでは部屋の響きによる声の変化を確認できます。インパルス応答は部屋の応答自体を再生します。"];if(id==="objectType"||id==="addObjectBtn"||id.startsWith("obj"))item=["Furniture and objects","Placement, size and rotation change path blocking and estimated absorption. These are box-based approximations.","家具の位置・大きさ・回転で経路遮蔽と推定吸音量が変わります。物体形状は箱で近似します。"];if(id.startsWith("dim"))item=guide[id];if(id.startsWith("src"))item=guide[id]||guide.srcX;if(id.startsWith("mic"))item=guide[id]||guide.micX;if(id==="directBalance")item=guide.directBalance;if(!item)item=["Room acoustics","Room dimensions, materials, source and microphone placement change arrival times, reflection levels and resonances.","部屋寸法・素材・音源とマイクの位置によって、到達時刻・反射の強さ・共鳴が変わります。"];const headingJa={"Room width":"部屋の幅","Room depth":"部屋の奥行","Ceiling height":"天井の高さ","Source position":"音源の位置","Microphone position":"マイクの位置","Source direction":"音源の向き","Microphone direction":"マイクの向き","Source beam width":"音源の指向幅","Microphone beam width":"マイクの指向幅","Direct / reverb balance":"直接音と残響音","Reflection order":"反射次数","Mode analysis limit":"モード解析の上限","Stereo spacing":"ステレオの間隔","Underwater call demo":"水中通話デモ","Surface material":"壁・床の素材","Room shape":"部屋の形状","Room preset":"部屋プリセット","Sample choice":"試聴サンプル","Furniture and objects":"家具・物体","Room acoustics":"室内音響"};title.textContent=ja?(headingJa[item[0]]||item[0]):item[0];text.textContent=ja?item[2]:item[1];}
  function isInRoom(x,y){if(x<0||y<0||x>state.dimensions.x||y>state.dimensions.y)return false;if(state.shape!=="lShape")return true;return !(x<state.dimensions.x*.42&&y>state.dimensions.y*.55);}
  function pathCrossesNotch(image,receiver,crosses,dims){const cuts=[0,...crosses.map(c=>c.t),1].sort((a,b)=>a-b);for(let i=0;i<cuts.length-1;i++)for(let k=1;k<8;k++){const t=cuts[i]+(cuts[i+1]-cuts[i])*k/8,p=foldPoint(image,receiver,t,dims);if(!isInRoom(p[0],p[1]))return true;}return false;}
  function wallMaterialAt(surface,p){const base=materials[state.surfaces[surface]],alpha=base.alpha.reduce((a,b)=>a+b,0)/8,scatter=base.scatter.reduce((a,b)=>a+b,0)/8;for(const o of state.objects){if(o.wall!==surface)continue;const axis=(surface==="north"||surface==="south")?p[0]:p[1],center=(surface==="north"||surface==="south")?o.position.x:o.position.y;if(Math.abs(axis-center)<o.size[0]/2&&p[2]>=o.position.z&&p[2]<=o.position.z+o.size[2])return {alpha:o.absorption.reduce((a,b)=>a+b,0)/8,scatter:o.scattering.reduce((a,b)=>a+b,0)/8,opening:!!o.opening};}return {alpha,scatter,opening:false};}
  function stereoReceivers(){const r=state.receiver;if(r.stereoEnabled===false)return [r,r];const a=(r.azimuthDeg||0)*Math.PI/180,dx=Math.cos(a)*((r.spacing||.2)/2),dy=-Math.sin(a)*((r.spacing||.2)/2);return [-1,1].map(side=>({...r,x:clamp(r.x+side*dx,.15,state.dimensions.x-.15),y:clamp(r.y+side*dy,.15,state.dimensions.y-.15),stereoEnabled:false}));}
  function applyRoomPreset(id){const presets={living:{title:"Living room",d:{x:6,y:7,z:2.8},surface:"plaster",items:[["sofa",2.8,2],["rug",3.2,2.4],["bookcase",.7,5.7],["plant",5.1,5.5],["windowGlass",3,7],["cushion",2.7,2.2]]},bedroom:{title:"Bedroom",d:{x:4,y:5,z:2.6},surface:"plaster",items:[["bed",2,3.5],["wardrobe",.8,4],["rug",2,1.8],["curtain",2,4.9],["cushion",1.5,3.4]]},kitchen:{title:"Kitchen",d:{x:4.5,y:4.5,z:2.6},surface:"plaster",items:[["cabinet",.9,4],["cabinet",2.4,4],["diningTable",2.3,2.1],["plant",3.8,3.6],["windowGlass",2.5,4.5]]},bathroom:{title:"Bathroom",d:{x:3,y:3.5,z:2.5},surface:"concrete",items:[["cabinet",.8,3],["windowGlass",1.8,3.5],["plant",2.5,2.8]]},washitsu:{title:"Japanese room",d:{x:3.6,y:3.6,z:2.4},surface:"wood",items:[["rug",1.8,1.8],["cushion",1.4,1.4],["diningTable",1.8,1.8],["windowGlass",1.8,3.6]]}};const p=presets[id];if(!p)return;state=defaultState();state.title=p.title;state.dimensions=p.d;state.source={x:p.d.x/2,y:p.d.y*.28,z:1.2,azimuthDeg:0,beamWidthDeg:360};state.receiver={x:p.d.x/2,y:p.d.y*.72,z:1.2,azimuthDeg:180,beamWidthDeg:360,stereoEnabled:true,spacing:.2};state.surfaces={floor:p.surface,ceiling:p.surface,west:p.surface,east:p.surface,south:p.surface,north:p.surface};state.objects=p.items.map(([type,x,y],i)=>{const m=objectCatalog[type];return {id:`${type}-${Date.now()}-${i}`,type,name:m.name,size:[...m.size],position:{x,y,z:0},rotationDeg:0,absorption:[...m.alpha],scattering:[...m.scatter],color:m.color,...(m.wall?{wall:m.wall}:{}),...(m.opening?{opening:true}:{})};});state.selectedObjectId=null;el("sceneTitle").textContent=state.title;syncControls();updateAll();simulate(false);}

  function updateAll() {
    clampPositions();
    clampObjects();
    syncControls();
    updateMetrics();
    drawAll();
    dirty = true;
    el("calcStatus").classList.remove("busy");
    el("calcStatus").innerHTML = "<i></i> SCENE UPDATED · SIMULATE";
  }

  function clampPositions() {
    for (const key of ["source", "receiver"]) {
      state[key].x = clamp(state[key].x, .15, state.dimensions.x-.15);
      state[key].y = clamp(state[key].y, .15, state.dimensions.y-.15);
      state[key].z = clamp(state[key].z, .1, state.dimensions.z-.1);
      if(state.shape==="lShape"&&!isInRoom(state[key].x,state[key].y)){state[key].x=clamp(state.dimensions.x*.42+.2,.15,state.dimensions.x-.15);state[key].y=clamp(state.dimensions.y*.55-.2,.15,state.dimensions.y-.15);}
    }
  }

  function syncControls() {
    el("dimX").value = fmt(state.dimensions.x, 1); el("dimY").value = fmt(state.dimensions.y, 1); el("dimZ").value = fmt(state.dimensions.z, 1);
    el("srcX").value = fmt(state.source.x); el("srcY").value = fmt(state.source.y); el("srcZ").value = fmt(state.source.z);
    el("micX").value = fmt(state.receiver.x); el("micY").value = fmt(state.receiver.y); el("micZ").value = fmt(state.receiver.z);
    el("srcXRange").max = state.dimensions.x; el("srcYRange").max = state.dimensions.y;
    el("micXRange").max = state.dimensions.x; el("micYRange").max = state.dimensions.y;
    el("srcXRange").value = state.source.x; el("srcYRange").value = state.source.y;
    el("micXRange").value = state.receiver.x; el("micYRange").value = state.receiver.y;
    el("srcAzimuth").value=state.source.azimuthDeg;el("srcBeamWidth").value=state.source.beamWidthDeg;
    el("micAzimuth").value=state.receiver.azimuthDeg;el("micBeamWidth").value=state.receiver.beamWidthDeg;
    el("micStereoEnabled").checked=state.receiver.stereoEnabled!==false;el("micSpacing").value=state.receiver.spacing??.2;
    el("micSpacingValue").textContent=`${fmt(state.receiver.spacing??.2,2)} m`;el("micSpacing").disabled=state.receiver.stereoEnabled===false;
    el("underwaterDemo").checked=!!state.underwaterDemo;el("roomShape").value=state.shape||"rect";
    el("srcAzValue").textContent=`${Math.round(state.source.azimuthDeg)}°`;el("srcWidthValue").textContent=`${Math.round(state.source.beamWidthDeg)}°`;
    el("micAzValue").textContent=`${Math.round(state.receiver.azimuthDeg)}°`;el("micWidthValue").textContent=`${Math.round(state.receiver.beamWidthDeg)}°`;
    const omni=language==="ja"?"無指向性":"OMNIDIRECTIONAL",dir=language==="ja"?"指向性":"DIRECTIONAL";
    el("sourcePatternLabel").textContent=state.source.beamWidthDeg>=359.5?omni:dir;el("receiverPatternLabel").textContent=state.receiver.beamWidthDeg>=359.5?omni:dir;
    el("reflectionOrder").value = state.order; el("orderValue").textContent = String(state.order);
    el("modeLimit").value = state.modeLimit; el("modeValue").textContent = state.modeLimit + " Hz";
    el("planReadout").textContent = `${fmt(state.dimensions.x,1)} × ${fmt(state.dimensions.y,1)} m · Z ${fmt(state.source.z,1)} m`;
    document.querySelectorAll(".surface-row select").forEach((select, i) => select.value = state.surfaces[surfaceNames[i]]);
    renderObjectList();syncObjectEditor();
  }

  function getSelectedObject(){return state.objects.find(o=>o.id===state.selectedObjectId)||null;}
  function addObject(){
    if(state.objects.length>=60){toast("Room object limit reached (60)");return;}
    const type=el("objectType").value,model=objectCatalog[type];if(!model)return;
    const count=state.objects.filter(o=>o.type===type).length;
    const object={id:`${type}-${Date.now()}-${count}`,type,name:model.name,size:[...model.size],rotationDeg:0,position:{x:clamp(state.source.x+.75,.4,state.dimensions.x-.4),y:clamp(state.source.y+1,.4,state.dimensions.y-.4),z:0},absorption:[...model.alpha],scattering:[...model.scatter],color:model.color,...(model.wall?{wall:model.wall}:{}),...(model.opening?{opening:true}:{})};if(model.wall){object.position.x=state.dimensions.x/2;object.position.y=state.dimensions.y-.04;object.position.z=Math.max(.1,(state.dimensions.z-object.size[2])/2);}
    state.objects.push(object);state.selectedObjectId=object.id;updateAll();toast(`${model.name} added`);
  }
  function deleteSelectedObject(){const id=state.selectedObjectId;if(!id)return;state.objects=state.objects.filter(o=>o.id!==id);state.selectedObjectId=state.objects.at(-1)?.id||null;updateAll();toast("Object removed");}
  function clampObjects(){
    for(const o of state.objects){
      o.size[0]=clamp(o.size[0],.1,state.dimensions.x);o.size[1]=clamp(o.size[1],.04,state.dimensions.y);o.size[2]=clamp(o.size[2],.03,state.dimensions.z);
      o.rotationDeg=Number.isFinite(o.rotationDeg)?((o.rotationDeg%360)+360)%360:0;if(o.rotationDeg>180)o.rotationDeg-=360;
      const angle=o.rotationDeg*Math.PI/180,ex=Math.abs(Math.cos(angle))*o.size[0]/2+Math.abs(Math.sin(angle))*o.size[1]/2,ey=Math.abs(Math.sin(angle))*o.size[0]/2+Math.abs(Math.cos(angle))*o.size[1]/2;
      const fit=Math.min(1,state.dimensions.x/(2*ex),state.dimensions.y/(2*ey));if(fit<1){o.size[0]*=fit;o.size[1]*=fit;}
      const boundX=Math.abs(Math.cos(angle))*o.size[0]/2+Math.abs(Math.sin(angle))*o.size[1]/2,boundY=Math.abs(Math.sin(angle))*o.size[0]/2+Math.abs(Math.cos(angle))*o.size[1]/2;
      o.position.x=clamp(o.position.x,boundX,state.dimensions.x-boundX);
      o.position.y=clamp(o.position.y,boundY,state.dimensions.y-boundY);
      o.position.z=clamp(o.position.z,0,state.dimensions.z-o.size[2]);
      if(o.wall){o.position.y=state.dimensions.y-.04;o.position.x=clamp(o.position.x,o.size[0]/2,state.dimensions.x-o.size[0]/2);}
      if(state.shape==="lShape"&&!isInRoom(o.position.x,o.position.y)){o.position.x=Math.max(o.position.x,state.dimensions.x*.42+boundX);o.position.y=Math.min(o.position.y,state.dimensions.y*.55-boundY);}
    }
  }
  function renderObjectList(){
    const list=el("objectList");el("objectCount").textContent=language==="ja"?`${state.objects.length} 個`:`${state.objects.length} ITEM${state.objects.length===1?"":"S"}`;
    if(!state.objects.length){list.innerHTML=`<div class="object-list-empty">${tr("No objects in this room")}</div>`;return;}
    list.innerHTML="";
    state.objects.forEach(o=>{const row=document.createElement("button");row.type="button";row.className="object-list-item"+(o.id===state.selectedObjectId?" selected":"");row.innerHTML=`<i style="background:${o.color||"#b38f66"}"></i><span>${escapeHTML(objectName(o))}</span><small>${fmt(o.size[0],1)}×${fmt(o.size[1],1)} m</small>`;row.addEventListener("click",()=>{state.selectedObjectId=o.id;syncControls();drawAll();});list.appendChild(row);});
  }
  function syncObjectEditor(){
    const o=getSelectedObject(),panel=el("objectProperties");panel.hidden=!o;if(!o)return;
    el("selectedObjectName").textContent=objectName(o).toUpperCase();
    el("objX").value=fmt(o.position.x);el("objY").value=fmt(o.position.y);el("objZ").value=fmt(o.position.z);
    el("objW").value=fmt(o.size[0]);el("objD").value=fmt(o.size[1]);el("objH").value=fmt(o.size[2]);el("objRot").value=fmt(o.rotationDeg||0,0);
  }

  function getAbsorption(surface, bandIndex) { return materials[state.surfaces[surface]].alpha[bandIndex]; }
  function meanAlpha(surface) { const a = materials[state.surfaces[surface]].alpha; return a.reduce((s,v)=>s+v,0)/a.length; }

  function roomAreaList() {
    const {x,y,z} = state.dimensions;
    return [x*y, x*y, y*z, y*z, x*z, x*z];
  }

  function t60At(frequency) {
    const areas = roomAreaList(); let aeq = 0, total = 0;
    for (let i=0;i<6;i++) {
      const name = surfaceNames[i], vals = materials[state.surfaces[name]].alpha;
      let alpha;
      if (frequency <= BANDS[0]) alpha=vals[0];
      else if (frequency >= BANDS.at(-1)) alpha=vals.at(-1);
      else {
        for (let b=0;b<BANDS.length-1;b++) if (frequency<=BANDS[b+1]) {
          const u=Math.log(frequency/BANDS[b])/Math.log(BANDS[b+1]/BANDS[b]);
          alpha=vals[b]+u*(vals[b+1]-vals[b]); break;
        }
      }
      aeq += areas[i]*alpha; total += areas[i];
    }
    for(const object of state.objects){
      const [w,d,h]=object.size,vals=object.absorption;
      const alpha=interpolateBands(vals,frequency);
      if(object.wall){aeq += w*h*(alpha-meanAlpha(object.wall));}else aeq += 2*(w*d+w*h+d*h)*alpha;
    }
    return aeq > 0 ? .161*state.dimensions.x*state.dimensions.y*state.dimensions.z/aeq : Infinity;
  }

  function interpolateBands(values,frequency){
    if(frequency<=BANDS[0])return values[0];
    if(frequency>=BANDS.at(-1))return values.at(-1);
    for(let i=0;i<BANDS.length-1;i++)if(frequency<=BANDS[i+1]){const u=Math.log(frequency/BANDS[i])/Math.log(BANDS[i+1]/BANDS[i]);return values[i]+u*(values[i+1]-values[i]);}
    return values.at(-1);
  }

  function imageCoord(source, length, index) { return index*length + (index%2===0 ? source : length-source); }
  function distance(a,b) { return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]); }
  function directivityGain(ray,device){
    const width=device.beamWidthDeg??360;if(width>=359.5)return 1;
    if(Math.hypot(ray[0],ray[1])<1e-9)return 1;
    const rayAz=Math.atan2(ray[0],ray[1])*180/Math.PI;
    const delta=((rayAz-device.azimuthDeg+540)%360)-180;
    return Math.pow(2,-Math.pow(delta/(width/2),2));
  }

  function pathCrossings(image, receiver, length, pathLength) {
    const out=[];
    const axes=[[0,"west","east"],[1,"south","north"],[2,"floor","ceiling"]];
    for(const [axis,low,high] of axes){
      const a=image[axis],b=receiver[axis]; if(Math.abs(b-a)<1e-12)continue;
      const first=Math.floor(Math.min(a,b)/length[axis])+1;
      const last=Math.ceil(Math.max(a,b)/length[axis])-1;
      for(let k=first;k<=last;k++){
        const t=(k*length[axis]-a)/(b-a);
        if(t>1e-10&&t<1-1e-10)out.push({t,surface:k%2===0?low:high,cosine:Math.abs(a-b)/pathLength});
      }
    }
    out.sort((a,b)=>b.t-a.t);
    return out;
  }

  function foldCoordinate(value,length){const cell=Math.floor(value/length),frac=value/length-cell;return (cell%2===0?frac:1-frac)*length;}
  function foldPoint(image,receiver,t,dims){return image.map((v,i)=>foldCoordinate(v+(receiver[i]-v)*t,dims[i]));}
  function segmentHitsObject(a,b,o){
    const angle=-(o.rotationDeg||0)*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
    const local=p=>{const dx=p[0]-o.position.x,dy=p[1]-o.position.y;return [dx*cos-dy*sin+o.position.x,dx*sin+dy*cos+o.position.y,p[2]];};
    a=local(a);b=local(b);
    const min=[o.position.x-o.size[0]/2,o.position.y-o.size[1]/2,o.position.z];
    const max=[o.position.x+o.size[0]/2,o.position.y+o.size[1]/2,o.position.z+o.size[2]];
    let lo=0,hi=1;
    for(let axis=0;axis<3;axis++){
      const delta=b[axis]-a[axis];
      if(Math.abs(delta)<1e-10){if(a[axis]<min[axis]||a[axis]>max[axis])return false;continue;}
      let t0=(min[axis]-a[axis])/delta,t1=(max[axis]-a[axis])/delta;if(t0>t1)[t0,t1]=[t1,t0];
      lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;
    }
    return hi>1e-5&&lo<1-1e-5;
  }
  function occludingObjects(image,receiver,crosses,dims){
    if(!state.objects.length)return [];
    const breaks=[0,1,...crosses.map(c=>c.t)].sort((a,b)=>a-b),segments=[];
    for(let i=0;i<breaks.length-1;i++)segments.push([foldPoint(image,receiver,breaks[i],dims),foldPoint(image,receiver,breaks[i+1],dims)]);
    return state.objects.filter(o=>segments.some(([a,b])=>segmentHitsObject(a,b,o)));
  }

  function calculatePaths(receiver=state.receiver) {
    const d=[state.dimensions.x,state.dimensions.y,state.dimensions.z];
    const s=[state.source.x,state.source.y,state.source.z];
    const r=[receiver.x,receiver.y,receiver.z];
    const direct=distance(s,r); const events=[];
    for(let ix=-state.order;ix<=state.order;ix++) for(let iy=-state.order;iy<=state.order;iy++) for(let iz=-state.order;iz<=state.order;iz++){
      const order=Math.abs(ix)+Math.abs(iy)+Math.abs(iz); if(order>state.order)continue;
      const image=[imageCoord(s[0],d[0],ix),imageCoord(s[1],d[1],iy),imageCoord(s[2],d[2],iz)];
      const len=distance(image,r), crosses=pathCrossings(image,r,d,len); if(crosses.length!==order)continue;
      let gain=direct/len;
      const parity=[Math.abs(ix)%2===0?1:-1,Math.abs(iy)%2===0?1:-1,Math.abs(iz)%2===0?1:-1];
      const launch=[(r[0]-image[0])*parity[0],(r[1]-image[1])*parity[1],(r[2]-image[2])*parity[2]];
      const arrival=[image[0]-r[0],image[1]-r[1],image[2]-r[2]];
      gain*=directivityGain(launch,state.source)*directivityGain(arrival,receiver);
      const sequence=[];
      for(const hit of crosses){const hitPoint=foldPoint(image,r,hit.t,d),surfaceMaterial=wallMaterialAt(hit.surface,hitPoint);gain*=Math.sqrt(Math.max(0,1-surfaceMaterial.alpha)*(1-surfaceMaterial.scatter));if(surfaceMaterial.opening)gain*=.04;sequence.push(hit.surface);}
      const blockers=occludingObjects(image,r,crosses,d);
      for(const object of blockers){const alpha=object.absorption.reduce((a,b)=>a+b,0)/object.absorption.length,scatter=object.scattering.reduce((a,b)=>a+b,0)/object.scattering.length;gain*=.1+.2*Math.sqrt(Math.max(0,1-alpha)*(1-scatter));}
      const propagationVector=[r[0]-image[0],r[1]-image[1],r[2]-image[2]],speed=flowAdjustedSpeed(propagationVector);
      if((state.shape||"rect")==="lShape"&&pathCrossesNotch(image,r,crosses,d))gain*=.02;
      events.push({time:len/speed,length:len,gain,order,surfaces:sequence,image,blockers:blockers.map(o=>o.id)});
    }
    events.sort((a,b)=>a.time-b.time);
    return events;
  }

  function calculateModes(receiver=state.receiver) {
    const d=state.dimensions,s=state.source,r=receiver, modes=[],c=soundSpeed();
    const maxIndex=Math.min(18,Math.ceil(state.modeLimit*2*Math.max(d.x,d.y,d.z)/c)+2);
    const basis=(n,pos,L)=>Math.sqrt((n===0?1:2)/L)*Math.cos(Math.PI*n*pos/L);
    for(let nx=0;nx<=maxIndex;nx++)for(let ny=0;ny<=maxIndex;ny++)for(let nz=0;nz<=maxIndex;nz++){
      if(nx===0&&ny===0&&nz===0)continue;
      const f=c/2*Math.sqrt((nx/d.x)**2+(ny/d.y)**2+(nz/d.z)**2);
      if(f>state.modeLimit)continue;
      const residue=basis(nx,s.x,d.x)*basis(ny,s.y,d.y)*basis(nz,s.z,d.z)*basis(nx,r.x,d.x)*basis(ny,r.y,d.y)*basis(nz,r.z,d.z);
      modes.push({indices:[nx,ny,nz],frequency:f,residue,t60:t60At(f)});
    }
    return modes.sort((a,b)=>a.frequency-b.frequency);
  }

  function updateMetrics() {
    const paths=calculatePaths();
    const direct=Math.hypot(state.source.x-state.receiver.x,state.source.y-state.receiver.y,state.source.z-state.receiver.z);
    const volume=state.dimensions.x*state.dimensions.y*state.dimensions.z*(state.shape==="lShape"?.811:1);
    const t60=t60At(1000);
    el("volumeMetric").innerHTML=`${fmt(volume,1)} <small>m³</small>`;
    el("distanceMetric").innerHTML=`${fmt(direct,2)} <small>m</small>`;
    el("arrivalMetric").innerHTML=`${fmt(direct/soundSpeed()*1000,1)} <small>ms</small>`;
    el("pathMetric").textContent=String(paths.length);
    el("distanceReadout").textContent=`SOURCE → MIC · ${fmt(direct,2)} m`;
    el("t60Metric").textContent=Number.isFinite(t60)?fmt(t60,2):"∞";
    el("t60Bar").style.width=`${clamp(t60/4*100,4,100)}%`;
    latest={paths,modes:calculateModes(),t60,generated:null};
    drawAnalysis();
    if(snapshots.some(Boolean))renderSnapshot();
  }

  function setupCanvas(canvas) {
    const rect=canvas.getBoundingClientRect(); const dpr=window.devicePixelRatio||1;
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx,w:rect.width,h:rect.height,dpr};
  }

  function drawRoom(canvas) {
    if(!canvas||canvas.clientWidth===0)return;
    const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);
    const pad=35, scale=Math.min((w-pad*2)/state.dimensions.x,(h-pad*2)/state.dimensions.y);
    const rw=state.dimensions.x*scale,rh=state.dimensions.y*scale,x0=(w-rw)/2,y0=(h-rh)/2;
    ctx.fillStyle="#10171c";ctx.fillRect(0,0,w,h);
    ctx.save();traceRoomOutline(ctx,x0,y0,scale);ctx.clip();
    ctx.fillStyle="#19242a";ctx.fillRect(x0,y0,rw,rh);
    ctx.strokeStyle="#202c33";ctx.lineWidth=1;
    for(let x=0;x<=state.dimensions.x;x+=1){const px=x0+x*scale;ctx.beginPath();ctx.moveTo(px,y0);ctx.lineTo(px,y0+rh);ctx.stroke();}
    for(let y=0;y<=state.dimensions.y;y+=1){const py=y0+y*scale;ctx.beginPath();ctx.moveTo(x0,py);ctx.lineTo(x0+rw,py);ctx.stroke();}
    const six=latest?.paths?.filter(p=>p.order===1).slice(0,6)||[];
    for(const p of six){
      const hit=reflectionPoint(p.image,[state.receiver.x,state.receiver.y,state.receiver.z],p.surfaces[0]);
      if(!hit)continue;
      const sx=x0+state.source.x*scale,sy=y0+(state.dimensions.y-state.source.y)*scale,mx=x0+state.receiver.x*scale,my=y0+(state.dimensions.y-state.receiver.y)*scale;
      const hx=x0+hit.x*scale,hy=y0+(state.dimensions.y-hit.y)*scale;
      ctx.strokeStyle="#77998f66";ctx.setLineDash([4,4]);ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(hx,hy);ctx.lineTo(mx,my);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle="#77998f";ctx.beginPath();ctx.arc(hx,hy,2.3,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle="#708078";ctx.lineWidth=1.5;traceRoomOutline(ctx,x0,y0,scale);ctx.stroke();
    for(const object of state.objects){
      const cx=x0+object.position.x*scale,cy=y0+(state.dimensions.y-object.position.y)*scale,ow=object.size[0]*scale,oh=object.size[1]*scale,selected=object.id===state.selectedObjectId;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(-(object.rotationDeg||0)*Math.PI/180);
      ctx.fillStyle=object.color||"#b38f66";ctx.globalAlpha=selected ? .38 : .25;ctx.fillRect(-ow/2,-oh/2,ow,oh);ctx.globalAlpha=1;
      ctx.strokeStyle=selected?"#dfc399":(object.color||"#b38f66");ctx.lineWidth=selected?1.7:1;ctx.setLineDash(selected?[]:[3,2]);ctx.strokeRect(-ow/2,-oh/2,ow,oh);ctx.setLineDash([]);
      drawObjectIcon(ctx,object.type,ow,oh,selected);
      if(ow>48&&oh>34){ctx.fillStyle=selected?"#f1e2c6":"#c1b194";ctx.font="8px ui-monospace,monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(objectName(object),0,0,ow-6);}
      if(selected){ctx.strokeStyle="#dfc399";ctx.fillStyle="#f1e2c6";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(0,-oh/2);ctx.lineTo(0,-oh/2-12);ctx.stroke();ctx.beginPath();ctx.arc(0,-oh/2-12,4,0,Math.PI*2);ctx.fill();ctx.stroke();}
      ctx.restore();
    }
    ctx.font="9px 'DM Mono',monospace";ctx.fillStyle="#72817f";ctx.textAlign="center";
    ctx.fillText(`${fmt(state.dimensions.x,1)} m`,x0+rw/2,y0+rh+19);
    ctx.save();ctx.translate(x0-13,y0+rh/2);ctx.rotate(-Math.PI/2);ctx.fillText(`${fmt(state.dimensions.y,1)} m`,0,0);ctx.restore();
    ctx.textAlign="left";ctx.fillStyle="#718078";ctx.font="8px 'DM Mono',monospace";
    ctx.fillText("N",x0+rw+9,y0+7);ctx.fillText("S",x0+rw+9,y0+rh-2);
    drawHandle(ctx,x0+state.source.x*scale,y0+(state.dimensions.y-state.source.y)*scale,"S","#ed9c65");
    drawHandle(ctx,x0+state.receiver.x*scale,y0+(state.dimensions.y-state.receiver.y)*scale,"M","#9ddcc8");
    if(state.receiver.stereoEnabled!==false)stereoReceivers().forEach((r,i)=>{const x=x0+r.x*scale,y=y0+(state.dimensions.y-r.y)*scale;ctx.fillStyle=i===0?"#8fc9bb":"#c1eadc";ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d8eee6";ctx.font="7px ui-monospace";ctx.textAlign="center";ctx.fillText(i===0?"L":"R",x,y-7);});
    if(state.source.beamWidthDeg<359.5)drawOrientation(ctx,x0+state.source.x*scale,y0+(state.dimensions.y-state.source.y)*scale,state.source,"#ed9c65");
    if(state.receiver.beamWidthDeg<359.5)drawOrientation(ctx,x0+state.receiver.x*scale,y0+(state.dimensions.y-state.receiver.y)*scale,state.receiver,"#9ddcc8");
    canvas._map={x0,y0,scale,rw,rh};
  }

  function traceRoomOutline(ctx,x0,y0,scale){const X=state.dimensions.x,Y=state.dimensions.y,px=x=>x0+x*scale,py=y=>y0+(Y-y)*scale;ctx.beginPath();if(state.shape==="lShape"){const cutX=X*.42,cutY=Y*.55;ctx.moveTo(px(0),py(0));ctx.lineTo(px(X),py(0));ctx.lineTo(px(X),py(Y));ctx.lineTo(px(cutX),py(Y));ctx.lineTo(px(cutX),py(cutY));ctx.lineTo(px(0),py(cutY));ctx.closePath();}else ctx.rect(x0,y0,X*scale,Y*scale);}

  function drawOrientation(ctx,x,y,device,color){
    const angle=device.azimuthDeg*Math.PI/180,spread=Math.min(device.beamWidthDeg/2,179)*Math.PI/180,r=23;
    ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=.82;ctx.lineWidth=1.2;
    const point=a=>[x+Math.sin(a)*r,y-Math.cos(a)*r];
    const left=point(angle-spread),right=point(angle+spread),front=point(angle);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(left[0],left[1]);ctx.moveTo(x,y);ctx.lineTo(right[0],right[1]);ctx.moveTo(x,y);ctx.lineTo(front[0],front[1]);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+Math.sin(angle)*r,y-Math.cos(angle)*r);ctx.lineTo(x+Math.sin(angle-.14)* (r-4),y-Math.cos(angle-.14)*(r-4));ctx.lineTo(x+Math.sin(angle+.14)*(r-4),y-Math.cos(angle+.14)*(r-4));ctx.closePath();ctx.fillStyle=color;ctx.fill();
    ctx.beginPath();ctx.arc(front[0],front[1],4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle="#10171c";ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
  }

  function drawObjectIcon(ctx,type,w,h,selected){
    if(w<18||h<12)return;const inset=Math.max(3,Math.min(w,h)*.1),x=-w/2+inset,y=-h/2+inset,iw=w-2*inset,ih=h-2*inset;
    ctx.save();ctx.strokeStyle=selected?"#f1e2c6":"#d5c4a6";ctx.fillStyle="#f1e2c622";ctx.lineWidth=1;ctx.setLineDash([]);
    const line=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
    if(type==="bed") {ctx.strokeRect(x,y,iw,ih);ctx.fillRect(x+2,y+2,iw*.22,ih*.34);ctx.strokeRect(x+2,y+2,iw*.22,ih*.34);line(x+iw*.3,y+ih*.42,x+iw-2,y+ih*.42);}
    else if(type==="sofa"){ctx.strokeRect(x,y+ih*.2,iw,ih*.72);ctx.strokeRect(x-1,y+ih*.08,iw*.18,ih*.88);ctx.strokeRect(x+iw*.82,y+ih*.08,iw*.18,ih*.88);line(x+iw*.5,y+ih*.22,x+iw*.5,y+ih*.9);}
    else if(type==="bookcase"){ctx.strokeRect(x,y,iw,ih);for(let k=1;k<4;k++)line(x,y+ih*k/4,x+iw,y+ih*k/4);}
    else if(type==="wardrobe"){ctx.strokeRect(x,y,iw,ih);line(x+iw/2,y,x+iw/2,y+ih);ctx.beginPath();ctx.arc(x+iw*.44,y+ih*.5,1.2,0,Math.PI*2);ctx.arc(x+iw*.56,y+ih*.5,1.2,0,Math.PI*2);ctx.fill();}
    else if(type==="clothes"){line(x,y+ih*.18,x+iw,y+ih*.18);for(let i=1;i<=3;i++){const hx=x+iw*i/4;line(hx,y+ih*.18,hx-3,y+ih*.36);line(hx,y+ih*.18,hx+3,y+ih*.36);line(hx-3,y+ih*.36,hx+3,y+ih*.36);}}
    else if(type==="curtain"){ctx.strokeRect(x,y,iw,ih);for(let k=1;k<5;k++)line(x+iw*k/5,y,x+iw*k/5,y+ih);}
    else if(type==="rug"){ctx.strokeRect(x,y,iw,ih);ctx.strokeRect(x+3,y+3,iw-6,ih-6);line(x+iw*.3,y+ih*.3,x+iw*.7,y+ih*.7);line(x+iw*.7,y+ih*.3,x+iw*.3,y+ih*.7);}
    else if(type==="desk"){ctx.strokeRect(x,y+ih*.2,iw,ih*.55);line(x+iw*.12,y+ih*.75,x+iw*.12,y+ih);line(x+iw*.88,y+ih*.75,x+iw*.88,y+ih);ctx.strokeRect(x+iw*.38,y+ih*.25,iw*.24,ih*.24);}
    else if(type==="absorber"){ctx.strokeRect(x,y,iw,ih);for(let k=1;k<5;k++)line(x+iw*k/5,y+2,x+iw*k/5,y+ih-2);}
    else if(type==="diffuser"){ctx.strokeRect(x,y,iw,ih);for(let k=0;k<4;k++){const xx=x+iw*k/4;ctx.beginPath();ctx.moveTo(xx,y+ih);ctx.lineTo(xx+iw/8,y+ih*.2);ctx.lineTo(xx+iw/4,y+ih);ctx.stroke();}}
    else if(type==="windowOpen"||type==="windowGlass"){ctx.strokeRect(x,y,iw,ih);line(x+iw/2,y,x+iw/2,y+ih);if(type==="windowGlass")line(x,y+ih/2,x+iw,y+ih/2);else{line(x+iw*.25,y+ih*.2,x+iw*.25,y+ih*.8);line(x+iw*.75,y+ih*.2,x+iw*.75,y+ih*.8);}}
    else if(type==="plant"){ctx.beginPath();ctx.moveTo(x+iw/2,y+ih);ctx.lineTo(x+iw/2,y+ih*.4);ctx.stroke();for(let k=0;k<4;k++){const yy=y+ih*(.25+k*.14);ctx.beginPath();ctx.ellipse(x+iw/2+(k%2?1:-1)*iw*.18,yy,iw*.2,ih*.11,(k%2?-.7:.7),0,Math.PI*2);ctx.stroke();}ctx.strokeRect(x+iw*.28,y+ih*.72,iw*.44,ih*.25);}
    else if(type==="cushion"){ctx.beginPath();ctx.roundRect(x,y,iw,ih,Math.min(6,iw*.18));ctx.stroke();line(x,y,x+iw,y+ih);}
    else if(type==="diningTable"){ctx.strokeRect(x+iw*.1,y+ih*.15,iw*.8,ih*.5);line(x+iw*.22,y+ih*.65,x+iw*.22,y+ih);line(x+iw*.78,y+ih*.65,x+iw*.78,y+ih);}
    else if(type==="cabinet"){ctx.strokeRect(x,y,iw,ih);line(x+iw/2,y,x+iw/2,y+ih);line(x+iw*.42,y+ih*.15,x+iw*.42,y+ih*.85);line(x+iw*.58,y+ih*.15,x+iw*.58,y+ih*.85);}
    ctx.restore();
  }

  function reflectionPoint(image,receiver,surface){
    const s=state.source,r=receiver;
    if(surface==="west"||surface==="east"){
      const x=surface==="west"?0:state.dimensions.x, t=(x-image[0])/(r[0]-image[0]);
      return {x,y:image[1]+t*(r[1]-image[1])};
    }
    if(surface==="south"||surface==="north"){
      const y=surface==="south"?0:state.dimensions.y,t=(y-image[1])/(r[1]-image[1]);
      return {x:image[0]+t*(r[0]-image[0]),y};
    }
    return null;
  }

  function drawHandle(ctx,x,y,label,color){
    ctx.save();ctx.shadowColor=color;ctx.shadowBlur=11;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.fillStyle="#10171c";ctx.beginPath();ctx.arc(x,y,2.4,0,Math.PI*2);ctx.fill();
    ctx.font="bold 8px 'DM Mono',monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=color;ctx.fillText(label,x,y-15);
  }

  function drawAll(){
    drawRoom(el("roomCanvas"));drawRoom(el("placementCanvas"));
    drawAnalysis();
  }

  function drawGrid(ctx,w,h,left,right,top,bottom,xTicks,yTicks){
    ctx.strokeStyle="#26333b";ctx.lineWidth=1;ctx.fillStyle="#687780";ctx.font="8px 'DM Mono',monospace";
    for(const t of xTicks){const x=left+(right-left)*t.p;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();ctx.textAlign="center";ctx.fillText(t.label,x,bottom+14);}
    for(const t of yTicks){const y=bottom-(bottom-top)*t.p;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.textAlign="right";ctx.fillText(t.label,left-6,y+3);}
  }

  function drawEtc(){
    const canvas=el("etcCanvas");if(canvas.clientWidth===0)return;const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);
    const l=34,r=w-10,t=6,b=h-21;drawGrid(ctx,w,h,l,r,t,b,[{p:0,label:"0"},{p:.2,label:"100"},{p:.4,label:"200"},{p:.6,label:"300"},{p:.8,label:"400"},{p:1,label:"500 ms"}],[{p:0,label:"−60"},{p:.5,label:"−30"},{p:1,label:"0 dB"}]);
    if(!latest)return;ctx.strokeStyle="#9ddcc8";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(l,b);
    const bins=100,energies=new Array(bins).fill(0);
    for(const p of latest.paths){const ms=p.time*1000;if(ms>500)continue;const ix=clamp(Math.floor(ms/500*bins),0,bins-1);energies[ix]+=p.gain*p.gain;}
    let peak=Math.max(...energies,1e-10);
    for(let i=0;i<bins;i++){const x=l+(i+.5)/bins*(r-l),db=10*Math.log10(Math.max(energies[i]/peak,1e-6)),y=b-(db+60)/60*(b-t);ctx.moveTo(x,b);ctx.lineTo(x,y);}
    ctx.stroke();ctx.fillStyle="#9ddcc8";for(let i=0;i<bins;i++)if(energies[i]>0){const x=l+(i+.5)/bins*(r-l),db=10*Math.log10(energies[i]/peak),y=b-(db+60)/60*(b-t);ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill();}
  }

  function drawModes(){
    const canvas=el("modeCanvas");if(canvas.clientWidth===0)return;const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);
    const l=40,r=w-12,t=10,b=h-25;const lo=31,hi=state.modeLimit;
    const xPos=f=>l+Math.log(f/lo)/Math.log(hi/lo)*(r-l);
    const ticks=[31.25,62.5,125,250,500].filter(f=>f>=lo&&f<=hi).map(f=>({p:Math.log(f/lo)/Math.log(hi/lo),label:String(Math.round(f))}));
    drawGrid(ctx,w,h,l,r,t,b,ticks,[{p:0,label:""},{p:.5,label:""},{p:1,label:""}]);
    if(!latest)return;const max=Math.max(...latest.modes.map(m=>Math.abs(m.residue)),1e-5);
    for(const mode of latest.modes){const x=xPos(Math.max(lo,mode.frequency)),power=Math.sqrt(Math.abs(mode.residue)/max),y=b-power*(b-t);ctx.strokeStyle=mode.residue<0?"#ed9c65":"#9ddcc8";ctx.globalAlpha=.42+.55*power;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,b);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=1;}
    const list=el("modeList");list.innerHTML="";
    latest.modes.slice(0,12).forEach(m=>{const p=document.createElement("span");p.className="mode-pill";p.innerHTML=`${m.indices.join("·")} <b>${fmt(m.frequency,1)} Hz</b>`;list.appendChild(p);});
    if(!latest.modes.length){const p=document.createElement("span");p.className="mode-pill";p.textContent="No modes in range";list.appendChild(p);}
  }

  function drawDecay(){
    const canvas=el("decayCanvas");if(canvas.clientWidth===0)return;const {ctx,w,h}=setupCanvas(canvas);ctx.clearRect(0,0,w,h);
    const l=40,r=w-13,t=10,b=h-25;
    drawGrid(ctx,w,h,l,r,t,b,[{p:0,label:"125"},{p:.25,label:"250"},{p:.5,label:"1k"},{p:.75,label:"4k"},{p:1,label:"16k Hz"}],[{p:0,label:"0"},{p:.5,label:"2"},{p:1,label:"4 s"}]);
    const freqs=[125,250,500,1000,2000,4000,8000,16000], max=4;
    ctx.strokeStyle="#a58ce5";ctx.lineWidth=1.6;ctx.beginPath();
    freqs.forEach((f,i)=>{const x=l+i/(freqs.length-1)*(r-l),v=t60At(f),y=b-clamp(v/max,0,1)*(b-t);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
    freqs.forEach((f,i)=>{const x=l+i/(freqs.length-1)*(r-l),v=t60At(f),y=b-clamp(v/max,0,1)*(b-t);ctx.fillStyle="#b6a4ed";ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();});
  }

  function drawAnalysis(){drawEtc();drawModes();drawDecay();}

  function attachDragging(canvas){
    canvas.addEventListener("pointerdown",e=>{
      const rect=canvas.getBoundingClientRect(),map=canvas._map;if(!map)return;
      const x=e.clientX-rect.left,y=e.clientY-rect.top;
      const sx=map.x0+state.source.x*map.scale,sy=map.y0+(state.dimensions.y-state.source.y)*map.scale;
      const mx=map.x0+state.receiver.x*map.scale,my=map.y0+(state.dimensions.y-state.receiver.y)*map.scale;
      const sourceTip=orientationTip(state.source,map),receiverTip=orientationTip(state.receiver,map);
      const objPoint=[(x-map.x0)/map.scale,state.dimensions.y-(y-map.y0)/map.scale];
      const rotateHandle=state.objects.find(o=>o.id===state.selectedObjectId&&(()=>{const [lx,ly]=objectLocalPoint(objPoint,o);return Math.abs(lx)<9/map.scale&&ly>o.size[1]/2+5/map.scale&&ly<o.size[1]/2+20/map.scale;})());
      const hit=rotateHandle||[...state.objects].reverse().find(o=>{const [lx,ly]=objectLocalPoint(objPoint,o);return Math.abs(lx)<=o.size[0]/2&&Math.abs(ly)<=o.size[1]/2;});
      if(state.source.beamWidthDeg<359.5&&Math.hypot(x-sourceTip[0],y-sourceTip[1])<10)dragging="sourceDirection";
      else if(state.receiver.beamWidthDeg<359.5&&Math.hypot(x-receiverTip[0],y-receiverTip[1])<10)dragging="receiverDirection";
      else if(Math.hypot(x-sx,y-sy)<18)dragging="source";
      else if(Math.hypot(x-mx,y-my)<18)dragging="receiver";
      else if(hit){state.selectedObjectId=hit.id;dragging=rotateHandle===hit?`rotateObject:${hit.id}`:`object:${hit.id}`;syncControls();}
      else return;
      canvas.setPointerCapture(e.pointerId);canvas.style.cursor="grabbing";
    });
    canvas.addEventListener("pointermove",e=>{
      if(!dragging)return;const rect=canvas.getBoundingClientRect(),map=canvas._map;
      const px=e.clientX-rect.left,py=e.clientY-rect.top,roomX=(px-map.x0)/map.scale,roomY=state.dimensions.y-(py-map.y0)/map.scale;
      if(dragging.startsWith("rotateObject:")){const o=state.objects.find(x=>x.id===dragging.slice(13));if(!o)return;const dx=roomX-o.position.x,dy=roomY-o.position.y;o.rotationDeg=-Math.atan2(dx,dy)*180/Math.PI;}
      else if(dragging.startsWith("object:")){const id=dragging.slice(7),o=state.objects.find(x=>x.id===id);if(!o)return;o.position.x=roomX;o.position.y=roomY;}
      else if(dragging==="sourceDirection"||dragging==="receiverDirection"){const p=dragging.startsWith("source")?state.source:state.receiver;p.azimuthDeg=(Math.atan2(roomX-p.x,roomY-p.y)*180/Math.PI+360)%360;}
      else {const p=state[dragging];p.x=roomX;p.y=roomY;}
      updateAll();
    });
    const end=()=>{dragging=null;canvas.style.cursor="default";};canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);
  }

  function objectLocalPoint(point,o){const dx=point[0]-o.position.x,dy=point[1]-o.position.y,a=-(o.rotationDeg||0)*Math.PI/180;return [dx*Math.cos(a)-dy*Math.sin(a),dx*Math.sin(a)+dy*Math.cos(a)];}
  function orientationTip(device,map){const angle=device.azimuthDeg*Math.PI/180;return [map.x0+device.x*map.scale+Math.sin(angle)*23,map.y0+(state.dimensions.y-device.y)*map.scale-Math.cos(angle)*23];}

  function simulate(showToast=false){
    el("calcStatus").classList.add("busy");el("calcStatus").innerHTML="<i></i> CALCULATING RESPONSE";
    // Defer work one frame so the status update paints before rendering the buffers.
    requestAnimationFrame(()=>{
      latest=calculateStereoResponse();
      dirty=false;drawAll();
      el("calcStatus").classList.remove("busy");el("calcStatus").innerHTML="<i></i> RESPONSE READY";
      updateSampleReadout();
      if(showToast)toast("Room response ready to audition");
    });
  }

  function calculateStereoResponse(){const pair=stereoReceivers(),channels=pair.map(r=>{const paths=calculatePaths(r),modes=calculateModes(r),t60=t60At(1000),components=makePreviewComponents(paths,modes,t60);return {paths,modes,t60,components};});const left=channels[0].components.combined,right=channels[1].components.combined;return {...channels[0],stereo:channels,generated:[left,right]};}

  function makePreviewComponents(paths,modes,t60){
    const n=Math.floor(SR*IR_SECONDS),direct=new Float32Array(n),reverb=new Float32Array(n);
    for(const p of paths){const at=p.time*SR,i=Math.floor(at),frac=at-i,target=p.order===0?direct:reverb;if(i>=0&&i<n){target[i]+=p.gain*(1-frac);if(i+1<n)target[i+1]+=p.gain*frac;}}
    // Low-mode resonances are a listening preview. Their level is intentionally
    // conservative because this browser prototype has no calibrated modal gain.
    for(const mode of modes){
      if(Math.abs(mode.residue)<1e-10)continue;
      const decay=Number.isFinite(mode.t60)?Math.exp(-6.907755/(SR*Math.max(mode.t60,.05))):1;
      const w=2*Math.PI*mode.frequency/SR,a1=2*decay*Math.cos(w),a2=-decay*decay;
      let p2=0,p1=mode.residue*decay*Math.sin(w);
      for(let i=1;i<n;i++){const v=a1*p1+a2*p2;reverb[i]+=v*0.12;p2=p1;p1=v;}
    }
    const rand=mulberry(717);const tStart=.075*SR;const diffuseT60=Number.isFinite(t60)?t60:2;
    for(let i=Math.floor(tStart);i<n;i++){const t=(i-tStart)/SR;reverb[i]+=(rand()*2-1)*.006*Math.pow(10,-3*t/Math.max(diffuseT60,.1));}
    let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(direct[i]+reverb[i]));
    if(peak>0){const gain=.82/peak;for(let i=0;i<n;i++){direct[i]*=gain;reverb[i]*=gain;}}
    const combined=new Float32Array(n);for(let i=0;i<n;i++)combined[i]=direct[i]+reverb[i];
    return {direct,reverb,combined};
  }

  function mulberry(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

  async function playPreview(){
    if(dirty||!latest?.generated)simulate(false);
    // Wait for the deferred synthesis if this was the first playback request.
    if(dirty){await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
    if(!latest?.generated)return;
    stopPreview();
    try{
      audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
      if(audioContext.state==="suspended")await audioContext.resume();
      const stereo=Array.isArray(latest.generated),buffer=audioContext.createBuffer(stereo?2:1,latest.generated[0]?.length||latest.generated.length,SR);if(stereo){buffer.copyToChannel(latest.generated[0],0);buffer.copyToChannel(latest.generated[1],1);}else buffer.copyToChannel(latest.generated,0);
      const source=audioContext.createBufferSource();source.buffer=buffer;activeSource=source;
      const gain=audioContext.createGain();gain.gain.value=.72;source.connect(gain).connect(audioContext.destination);
      source.onended=()=>{if(activeSource!==source)return;activeSource=null;if(loopPlayback&&!suppressLoop)playPreview();else el("audioPulse").classList.remove("playing");};
      suppressLoop=false;source.start();el("audioPulse").classList.add("playing");
    }catch(err){toast("Audio playback is unavailable in this browser");}
  }

  function updateSampleReadout(){
    const mode=el("sampleSelect").value;
    el("directControlWrap").hidden=mode==="rir";
    if(mode==="rir"){
      el("audioLabel").textContent=language==="ja"?"インパルス応答":"IMPULSE RESPONSE";
      el("audioMeta").textContent=language==="ja"?`${SR/1000} kHz · モノラル · ${IR_SECONDS.toFixed(1)} 秒`:`${SR/1000} kHz · MONO · ${IR_SECONDS.toFixed(1)} s`;
    }else{
      const lang=mode.endsWith("ja")?"ja":"en";
      el("audioLabel").textContent=language==="ja"?"会話サンプル":"CONVERSATION SAMPLE";
      el("audioMeta").textContent=language==="ja"?(lang==="ja"?"日本語 · 部屋の響きを試聴":"英語 · 部屋の響きを試聴"):(lang==="ja"?"Japanese · through this room":"English · through this room");
      if(state.underwaterDemo)el("audioMeta").textContent+=language==="ja"?" · 水中通話デモ":" · underwater demo";
    }
  }

  function updateDirectBalance(){
    const mix=Number(el("directBalance").value),value=mix/100;
    const direct=Math.sin(value*Math.PI/2),reverb=Math.cos(value*Math.PI/2);
    el("directBalanceValue").textContent=`${mix}%`;
    if(audioContext){if(directGainNode)directGainNode.gain.setTargetAtTime(direct,audioContext.currentTime,.015);if(reverbGainNode)reverbGainNode.gain.setTargetAtTime(reverb,audioContext.currentTime,.015);}
  }

  async function playAudition(){
    const mode=el("sampleSelect").value;
    if(mode==="rir"){playPreview();return;}
    try{
      audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();
      if(audioContext.state==="suspended")await audioContext.resume();
      if(dirty||!latest?.generated){
        latest=calculateStereoResponse();dirty=false;drawAll();
        el("calcStatus").classList.remove("busy");el("calcStatus").innerHTML=`<i></i> ${language==="ja"?"応答を計算しました":"RESPONSE READY"}`;
      }
      stopPreview();
      if(!sampleAudio){
        sampleAudio=new Audio();sampleAudio.preload="auto";
        sampleSource=audioContext.createMediaElementSource(sampleAudio);
        directConvolver=audioContext.createConvolver();directConvolver.normalize=false;
        reverbConvolver=audioContext.createConvolver();reverbConvolver.normalize=false;
        underwaterHighpass=audioContext.createBiquadFilter();underwaterHighpass.type="highpass";
        underwaterLowpass=audioContext.createBiquadFilter();underwaterLowpass.type="lowpass";underwaterHighpass.connect(underwaterLowpass);applyUnderwaterTone();
        directGainNode=audioContext.createGain();reverbGainNode=audioContext.createGain();
        reverbGainNode.gain.value=1;
        auditionCompressor=audioContext.createDynamicsCompressor();
        auditionCompressor.threshold.value=-8;auditionCompressor.knee.value=4;auditionCompressor.ratio.value=12;
        auditionCompressor.attack.value=.003;auditionCompressor.release.value=.12;
        const headroom=audioContext.createGain();headroom.gain.value=.58;
        sampleSource.connect(underwaterHighpass);
        underwaterLowpass.connect(directConvolver).connect(directGainNode).connect(auditionCompressor);
        underwaterLowpass.connect(reverbConvolver).connect(reverbGainNode).connect(auditionCompressor);
        auditionCompressor.connect(headroom).connect(audioContext.destination);updateDirectBalance();
        sampleAudio.addEventListener("ended",()=>el("audioPulse").classList.remove("playing"));
      }
      const directIR=audioContext.createBuffer(2,latest.components.direct.length,SR),reverbIR=audioContext.createBuffer(2,latest.components.reverb.length,SR);for(let ch=0;ch<2;ch++){directIR.copyToChannel(latest.stereo[ch].components.direct,ch);reverbIR.copyToChannel(latest.stereo[ch].components.reverb,ch);}directConvolver.buffer=directIR;reverbConvolver.buffer=reverbIR;
      const lang=mode.endsWith("ja")?"ja":"en";
      sampleAudio.loop=loopPlayback;
      sampleAudio.src=window.ROOM_SAMPLE_AUDIO?.[lang]||"";sampleAudio.currentTime=0;
      await sampleAudio.play();el("audioPulse").classList.add("playing");
    }catch(err){toast(language==="ja"?"会話サンプルを再生できませんでした。ページを再読み込みしてください。":"Could not play the conversation sample. Reload the page and try again.");}
  }

  function togglePlayback(){if(activeSource||(sampleAudio&&!sampleAudio.paused)){stopPreview();return;}playAudition();}

  function stopPreview(){suppressLoop=true;if(activeSource){try{activeSource.stop();}catch(_e){}activeSource.disconnect();activeSource=null;}if(sampleAudio&&!sampleAudio.paused){sampleAudio.pause();sampleAudio.currentTime=0;}el("audioPulse").classList.remove("playing");}

  function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}

  function saveScene(){const scene=normalizedScene();const payload={...scene,solver:{imageSourceOrder:state.order,modalLimitHz:state.modeLimit,underwaterDemo:!!state.underwaterDemo}};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),`${slug(state.title)}.room.json`);toast("Scene JSON saved");}
  function slug(s){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"room-scene";}

  function loadScene(event){
    const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();
    reader.onload=()=>{try{
      const data=JSON.parse(reader.result);if(data.formatVersion!==1||!data.room?.dimensions||!data.room?.surfaces)throw new Error("Unsupported scene format");
      state.title=data.title||file.name.replace(/\.room\.json$|\.json$/i,"");state.dimensions={x:Number(data.room.dimensions.x),y:Number(data.room.dimensions.y),z:Number(data.room.dimensions.z)};
      state.shape=data.room.shape==="lShape"?"lShape":"rect";state.underwaterDemo=!!data.solver?.underwaterDemo;
      if(Object.values(state.dimensions).some(v=>!Number.isFinite(v)||v<=0))throw new Error("Room dimensions must be positive numbers");
      for(const id of surfaceNames){
        const item=data.room.surfaces[id],materialId=item?.id;
        if(!materialId||!Array.isArray(item.absorption)||item.absorption.length!==BANDS.length||!Array.isArray(item.scattering)||item.scattering.length!==BANDS.length)throw new Error(`Invalid material data on ${surfaceLabels[id]}`);
        if([...item.absorption,...item.scattering].some(v=>!Number.isFinite(Number(v))||Number(v)<0||Number(v)>1))throw new Error(`Material coefficients on ${surfaceLabels[id]} must be from 0 to 1`);
        if(!materials[materialId])materials[materialId]={name:item.name||materialId,alpha:item.absorption.map(Number),scatter:item.scattering.map(Number),source:item.source||"imported-scene",confidence:item.confidence??0.5};
        state.surfaces[id]=materialId;
      }
      state.objects=(data.room.objects||[]).map((item,index)=>{
        const m=item.material,model=objectCatalog[item.type];
        if(!item.id||!item.position||!item.dimensions||!m||!Array.isArray(m.absorption)||!Array.isArray(m.scattering)||m.absorption.length!==BANDS.length||m.scattering.length!==BANDS.length)throw new Error(`Invalid room object at item ${index+1}`);
        if([...m.absorption,...m.scattering].some(v=>!Number.isFinite(Number(v))||Number(v)<0||Number(v)>1))throw new Error(`Invalid acoustic values for ${item.type}`);
        const size=[Number(item.dimensions.x),Number(item.dimensions.y),Number(item.dimensions.z)],position={x:Number(item.position.x),y:Number(item.position.y),z:Number(item.position.z)};
        if(size.some(v=>!Number.isFinite(v)||v<=0)||Object.values(position).some(v=>!Number.isFinite(v)))throw new Error(`Invalid size or position for ${item.type}`);
        return {id:item.id,type:item.type,name:model?.name||m.name||item.type,size,position,rotationDeg:Number(item.rotationDegrees??0),absorption:m.absorption.map(Number),scattering:m.scattering.map(Number),color:model?.color||"#b38f66",...(model?.wall?{wall:model.wall}:{}),...(model?.opening?{opening:true}:{})};
      });state.selectedObjectId=state.objects.at(-1)?.id||null;
      if(!data.source?.position||!data.receiver?.position)throw new Error("Scene is missing source or receiver coordinates");
      const readPoint=p=>{const f=p.forward||{x:0,y:1},az=(Math.atan2(Number(f.x)||0,Number(f.y)||0)*180/Math.PI+360)%360;return {x:Number(p.position.x),y:Number(p.position.y),z:Number(p.position.z),azimuthDeg:az,beamWidthDeg:Number(p.beamWidthDegrees??360),stereoEnabled:p.stereo?.enabled??true,spacing:Number(p.stereo?.spacingMeters??.2)};};
      state.source=readPoint(data.source);state.receiver=readPoint(data.receiver);
      if([...Object.values(state.source),...Object.values(state.receiver)].some(v=>!Number.isFinite(v)))throw new Error("Source and receiver coordinates must be numbers");
      state.order=clamp(data.solver?.imageSourceOrder??4,0,8);state.modeLimit=clamp(data.solver?.modalLimitHz??250,100,500);el("sceneTitle").textContent=state.title;initSurfaceControls();syncControls();updateAll();simulate(false);toast("Scene loaded");
    }catch(err){toast(err.message||"Could not open scene");}finally{event.target.value="";}};reader.readAsText(file);
  }

  function resetScene(){state=defaultState();el("sceneTitle").textContent=state.title;syncControls();updateAll();simulate(false);toast("Example room restored");}

  function saveSnapshot(){
    const distanceNow=distance([state.source.x,state.source.y,state.source.z],[state.receiver.x,state.receiver.y,state.receiver.z]);
    const index=nextSnapshotSlot;snapshots[index]=JSON.parse(JSON.stringify({state,t60:t60At(1000),distance:distanceNow}));
    const nextEmpty=(index+1)%4;const firstEmpty=Array.from({length:4},(_,i)=>(index+1+i)%4).find(i=>!snapshots[i]);
    nextSnapshotSlot=firstEmpty??nextEmpty;persistSnapshots();renderSnapshot();toast(language==="ja"?`シーン${"ABCD"[index]}を保存しました`:`Scene ${"ABCD"[index]} saved`);
  }
  function clearSnapshot(){snapshots=[null,null,null,null];nextSnapshotSlot=0;persistSnapshots();renderSnapshot();}
  function loadSnapshots(){try{const raw=localStorage.getItem("roomSpaceScenesV1"),parsed=raw?JSON.parse(raw):null;if(Array.isArray(parsed)&&parsed.length===4)snapshots=parsed.map(s=>s&&s.state?.dimensions&&s.state?.source&&s.state?.receiver?s:null);const first=snapshots.findIndex(s=>!s);nextSnapshotSlot=first<0?0:first;}catch(_e){snapshots=[null,null,null,null];nextSnapshotSlot=0;}}
  function persistSnapshots(){try{localStorage.setItem("roomSpaceScenesV1",JSON.stringify(snapshots));}catch(_e){toast(language==="ja"?"シーン保存領域が不足しています":"Could not save scene slots in browser storage");}}
  function updateSnapshotButton(){const label=el("snapshotButtonLabel");if(!label)return;const slot="ABCD"[nextSnapshotSlot],full=snapshots.every(Boolean);label.textContent=language==="ja"?(full?`シーン${slot}を更新`:`シーン${slot}に保存（${nextSnapshotSlot+1}/4）`):(full?`Replace ${slot}`:`Save ${slot} · ${nextSnapshotSlot+1}/4`);}
  function renderSnapshot(){
    const box=el("compareContent"),clear=el("clearCompare");if(!box)return;clear.hidden=!snapshots.some(Boolean);updateSnapshotButton();box.className="snapshot-list";box.innerHTML="";
    const palette=["#9ddcc8","#ed9c65","#9eb8f1","#c2a7e8"];
    snapshots.forEach((saved,index)=>{
      const row=document.createElement("div");row.className="snapshot-row"+(saved?" saved":"");
      const mark=document.createElement("i");mark.style.background=palette[index];
      const title=document.createElement("b");title.textContent=`${"ABCD"[index]} · ${saved? saved.state.title:(language==="ja"?"未登録":"Empty")}`;
      row.append(mark,title);
      if(saved){const info=document.createElement("small");info.textContent=`RT60 ${fmt(saved.t60,2)} s · ${fmt(saved.distance,2)} m`;const load=document.createElement("button");load.type="button";load.className="snapshot-load";load.textContent=language==="ja"?"読込":"LOAD";load.addEventListener("click",()=>restoreSnapshot(index));row.append(info,load);}
      box.appendChild(row);
    });
  }
  function restoreSnapshot(index){const saved=snapshots[index];if(!saved)return;state=JSON.parse(JSON.stringify(saved.state));el("sceneTitle").textContent=state.title;syncControls();updateAll();simulate(false);toast(language==="ja"?`シーン${"ABCD"[index]}を読み込みました`:`Scene ${"ABCD"[index]} loaded`);}

  function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

  function exportRir(){
    if(dirty||!latest?.generated)simulate(false);
    if(dirty){requestAnimationFrame(()=>requestAnimationFrame(()=>{if(latest?.generated)downloadRir();}));return;}
    downloadRir();
  }
  function downloadRir(){const samples=latest.generated;const blob=encodeWav(Array.isArray(samples)?samples:[samples,samples],SR);downloadBlob(blob,`${slug(state.title)}-stereo-rir-preview.wav`);toast("Stereo RIR WAV exported");}

  function encodeWav(channels,sampleRate){
    const channelCount=channels.length,frames=channels[0].length,buffer=new ArrayBuffer(44+frames*channelCount*2),view=new DataView(buffer);
    const write=(offset,str)=>{for(let i=0;i<str.length;i++)view.setUint8(offset+i,str.charCodeAt(i));};
    write(0,"RIFF");view.setUint32(4,36+frames*channelCount*2,true);write(8,"WAVE");write(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channelCount,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*channelCount*2,true);view.setUint16(32,channelCount*2,true);view.setUint16(34,16,true);write(36,"data");view.setUint32(40,frames*channelCount*2,true);
    for(let i=0;i<frames;i++)for(let ch=0;ch<channelCount;ch++){const sample=clamp(channels[ch][i],-1,1);view.setInt16(44+(i*channelCount+ch)*2,Math.round(sample<0?sample*32768:sample*32767),true);}return new Blob([buffer],{type:"audio/wav"});
  }

  function toast(message){const node=el("toast");node.textContent=message;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),2200);}

  loadSnapshots();initSurfaceControls();bindControls();attachDragging(el("roomCanvas"));attachDragging(el("placementCanvas"));syncControls();updateMetrics();updateSampleReadout();updateDirectBalance();updateParameterGuide();renderSnapshot();
  try { const saved=localStorage.getItem("roomSpaceLanguage");if(saved==="ja"){el("languageSelect").value="ja";setLanguage("ja");} } catch(_e){}
  simulate(false);
})();
