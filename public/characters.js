// 유형별 조선 개미 캐릭터 (SVG). 모든 캐릭터는 같은 몸통에 한복 색·표정·소품만 다르다.
const INK = "#1d1a16";
const HEAD = "#3b3b3b";
const RED = "#c8372d";
const BLUE = "#2f5fb3";
const GOLD = "#f2c14e";
const WOOD = "#8a5a2b";
const STRAW = "#e2c27a";
const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const S3 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

// 테두리가 있는 굵은 선 (막대, 팔 등)
function bar(d, color, w) {
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 7}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function star(cx, cy, r, fill = GOLD) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" ${S3}/>`;
}

function drop(x, y) {
  return `<path d="M${x} ${y - 10} C${x + 7} ${y - 2} ${x + 7} ${y + 6} ${x} ${y + 6} C${x - 7} ${y + 6} ${x - 7} ${y - 2} ${x} ${y - 10} Z" fill="#7cc4ff" ${S3}/>`;
}

// 가운데 네모 구멍이 뚫린 엽전
function yeopjeon(x, y, r = 9) {
  const h = r * 0.35;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" ${S3}/>` +
    `<rect x="${x - h}" y="${y - h}" width="${h * 2}" height="${h * 2}" fill="#fff8e6" stroke="${INK}" stroke-width="2"/>`;
}


function headband(color) {
  return `<path d="M57 70 Q100 56 143 70 L142 82 Q100 68 58 82 Z" fill="${color}" ${S3}/>` +
    `<path d="M142 74 l16 -8 M142 78 l16 6" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M142 74 l16 -8 M142 78 l16 6" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
}

// 상투
const sangtu = `<circle cx="100" cy="42" r="9" fill="${HEAD}" ${S3}/><path d="M92 47 L108 47" stroke="${GOLD}" stroke-width="3"/>`;

// 갓
const gat = `<path d="M66 54 Q62 92 80 116" stroke="${INK}" stroke-width="2" fill="none"/><path d="M134 54 Q138 92 120 116" stroke="${INK}" stroke-width="2" fill="none"/>` +
  `<ellipse cx="100" cy="50" rx="62" ry="10" fill="#2a2a2a" ${S}/><path d="M80 48 L82 20 Q100 13 118 20 L120 48 Z" fill="#2a2a2a" ${S}/>`;

// 탕건 (짧은 검은 관)
const tanggeon = `<path d="M72 58 Q72 32 100 30 Q128 32 128 58 Q100 50 72 58 Z" fill="#2a2a2a" ${S}/><path d="M100 30 L100 52" stroke="#555" stroke-width="2"/>`;

// 패랭이 (대나무 갓) + 꽃
const paeraengi = `<ellipse cx="100" cy="52" rx="50" ry="9" fill="${STRAW}" ${S}/><path d="M78 50 Q80 28 100 26 Q120 28 122 50 Z" fill="${STRAW}" ${S}/>` +
  `<path d="M80 44 Q100 38 120 44" stroke="${WOOD}" stroke-width="2" fill="none"/><circle cx="118" cy="34" r="7" fill="#ef6f8e" ${S3}/><circle cx="118" cy="34" r="2.5" fill="${GOLD}"/>`;

// 유건 (유생 모자)
const yugeon = `<path d="M70 58 L74 28 L100 20 L126 28 L130 58 Q100 50 70 58 Z" fill="#2a2a2a" ${S}/><path d="M100 20 L100 52" stroke="#666" stroke-width="2"/>`;

// ---------- 몸통 ----------
const POSES = {
  down: { l: "M66 140 Q50 160 50 182", r: "M134 140 Q150 160 150 182", lh: [50, 184], rh: [150, 184] },
  up:   { l: "M66 140 Q50 160 50 182", r: "M134 138 Q160 118 162 82", lh: [50, 184], rh: [162, 78] },
  hold: { l: "M66 140 Q58 166 84 168", r: "M134 140 Q142 166 116 168", lh: [86, 168], rh: [114, 168] },
};

function body(c) {
  return `<path d="M56 202 L63 142 Q70 118 100 116 Q130 118 137 142 L144 202 Z" fill="${c.color}" ${S}/>` +
    `<path d="M82 121 L100 152 L118 121" fill="none" stroke="${INK}" stroke-width="11" stroke-linejoin="round"/>` +
    `<path d="M82 121 L100 152 L118 121" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M106 156 l6 26 M106 156 l16 20" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M106 156 l6 26 M106 156 l16 20" stroke="${c.tie}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M106 156 q14 -10 18 2 q-8 8 -18 -2 Z" fill="${c.tie}" ${S3}/>`;
}

function arms(c) {
  const p = POSES[c.pose];
  return bar(p.l, c.color, 15) + bar(p.r, c.color, 15);
}

function hands(c) {
  const p = POSES[c.pose];
  return `<circle cx="${p.lh[0]}" cy="${p.lh[1]}" r="8" fill="${HEAD}" ${S3}/>` +
    `<circle cx="${p.rh[0]}" cy="${p.rh[1]}" r="${c.fist ? 11 : 8}" fill="${HEAD}" ${S3}/>`;
}

function head() {
  return `<path d="M84 52 Q76 32 66 22" fill="none" ${S}/><path d="M116 52 Q124 32 134 22" fill="none" ${S}/>` +
    `<circle cx="66" cy="19" r="6" fill="${HEAD}" ${S3}/><circle cx="134" cy="19" r="6" fill="${HEAD}" ${S3}/>` +
    `<ellipse cx="100" cy="84" rx="44" ry="40" fill="${HEAD}" ${S}/>` +
    `<ellipse cx="78" cy="62" rx="8" ry="4" fill="#fff" opacity="0.25" transform="rotate(-25 78 62)"/>`;
}

// ---------- 표정 ----------
const W = `stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"`;
const eyes = (px = 1, py = 2) =>
  `<ellipse cx="84" cy="85" rx="10" ry="12" fill="#fff" ${S3}/><ellipse cx="116" cy="85" rx="10" ry="12" fill="#fff" ${S3}/>` +
  `<circle cx="${84 + px}" cy="${85 + py}" r="5" fill="${INK}"/><circle cx="${116 + px}" cy="${85 + py}" r="5" fill="${INK}"/>`;
const blush = `<ellipse cx="70" cy="100" rx="7" ry="4" fill="#ff8fa0" opacity="0.85"/><ellipse cx="130" cy="100" rx="7" ry="4" fill="#ff8fa0" opacity="0.85"/>`;
const openMouth = `<path d="M90 102 Q100 118 110 102 Z" fill="#e25563" ${S3}/>`;
const angryBrows = `<path d="M72 70 L96 80" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M128 70 L104 80" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;

const FACES = {
  happy: () => eyes() + blush + openMouth,
  grin: () => `<path d="M75 89 Q84 77 93 89" ${W}/><path d="M107 89 Q116 77 125 89" ${W}/>` + blush + openMouth,
  angry: () => eyes(0, 3) + angryBrows + `<path d="M92 108 Q100 102 108 108" ${W}/>`,
  shout: () => eyes(0, 3) + angryBrows + `<ellipse cx="100" cy="107" rx="9" ry="8" fill="#e25563" ${S3}/>`,
  sad: () => eyes(0, 4) + `<path d="M74 74 L94 69" ${W}/><path d="M126 74 L106 69" ${W}/>` + blush +
    `<path d="M90 109 Q95 104 100 109 Q105 114 110 109" ${W}/>` + drop(72, 106),
  sly: () => `<path d="M74 87 Q84 79 94 87 Q84 95 74 87 Z" fill="#fff" ${S3}/><path d="M106 87 Q116 79 126 87 Q116 95 106 87 Z" fill="#fff" ${S3}/>` +
    `<circle cx="87" cy="87" r="4" fill="${INK}"/><circle cx="119" cy="87" r="4" fill="${INK}"/>` + blush + `<path d="M91 104 Q101 110 111 100" ${W}/>`,
  calm: () => `<path d="M75 86 Q84 92 93 86" ${W}/><path d="M107 86 Q116 92 125 86" ${W}/>` + blush + `<path d="M94 104 Q100 109 106 104" ${W}/>`,
};

// ---------- 유형별 설정 ----------
// back: 몸 뒤, top: 머리 위(모자 등), front: 몸 앞(손에 든 것), extra: 맨 위(효과)
// handsFirst: 손을 소품 뒤에 그림 (소품을 앞에서 받쳐 든 모양)
const ANTS = {
  // 관상쟁이: 탕건, 캔들 그려진 부채
  ATDO: { color: "#e8dcc2", tie: "#8a3b2e", pose: "hold", face: "sly", handsFirst: true,
    top: tanggeon,
    front: `<path d="M100 190 L60 168 A44 44 0 0 1 140 168 Z" fill="#fff6e0" ${S}/>` +
      `<path d="M100 190 L76 154 M100 190 L100 146 M100 190 L124 154" stroke="#d9c49a" stroke-width="2"/>` +
      `<rect x="76" y="160" width="7" height="12" fill="${BLUE}" stroke="${INK}" stroke-width="1.5"/>` +
      `<rect x="89" y="152" width="7" height="14" fill="${RED}" stroke="${INK}" stroke-width="1.5"/>` +
      `<rect x="103" y="156" width="7" height="10" fill="${BLUE}" stroke="${INK}" stroke-width="1.5"/>` +
      `<rect x="116" y="148" width="7" height="16" fill="${RED}" stroke="${INK}" stroke-width="1.5"/>` },
  // 줄타기 광대: 패랭이, 부채, 발밑의 줄
  ATDF: { color: "#cfe3f2", tie: RED, pose: "up", face: "grin",
    top: paeraengi,
    front: `<path d="M162 78 L140 46 A36 36 0 0 1 186 42 Z" fill="${RED}" ${S3}/><path d="M162 78 L152 44 M162 78 L170 40" stroke="#fff" stroke-width="2"/>`,
    extra: `<path d="M0 186 Q100 198 200 186" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M0 186 Q100 198 200 186" fill="none" stroke="${STRAW}" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 4"/>` },
  // 땅 파는 머슴: 흰 머리띠, 괭이, 흙더미
  ATIO: { color: "#e6d3a8", tie: WOOD, pose: "up", face: "angry", fist: true,
    top: headband("#ffffff"),
    front: bar("M162 96 L178 22", WOOD, 6) + `<path d="M170 20 L198 30 L194 42 L172 32 Z" fill="#9aa3ad" ${S3}/>`,
    extra: `<path d="M0 202 Q16 172 40 182 Q58 170 74 202 Z" fill="${WOOD}" ${S}/><circle cx="28" cy="188" r="3" fill="#5a3a1a"/><circle cx="48" cy="192" r="3" fill="#5a3a1a"/>` + drop(144, 54) },
  // 잔칫집 손님: 상투, 잔치국수 그릇, 급한 발걸음
  ATIF: { color: "#f9d9c4", tie: RED, pose: "hold", face: "happy", handsFirst: true,
    top: sangtu,
    front: `<path d="M82 156 Q90 146 98 156 Q106 146 114 156" stroke="${GOLD}" stroke-width="5" fill="none"/>` +
      `<path d="M74 156 L126 156 Q122 184 100 186 Q78 184 74 156 Z" fill="#f5f5f0" ${S}/><path d="M80 166 L120 166" stroke="${BLUE}" stroke-width="3"/>` +
      bar("M116 152 L140 128", WOOD, 2) + bar("M122 154 L146 132", WOOD, 2),
    extra: `<path d="M8 104 L34 104 M4 120 L30 120 M10 136 L32 136" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>` + drop(150, 52) },

  // 성균관 유생: 유건, 사업보고서 두루마리
  ALDO: { color: "#dfe8f2", tie: "#2f4a7a", pose: "hold", face: "happy", handsFirst: true,
    top: yugeon,
    front: `<rect x="66" y="150" width="68" height="26" fill="#fff6e0" ${S3}/>` +
      `<rect x="58" y="145" width="11" height="36" rx="4" fill="${WOOD}" ${S3}/><rect x="131" y="145" width="11" height="36" rx="4" fill="${WOOD}" ${S3}/>` +
      `<path d="M74 158 L126 158 M74 164 L120 164 M74 170 L124 170" stroke="#b9a57a" stroke-width="2" stroke-linecap="round"/>` },
  // 심마니: 머리띠, 망태기, 산삼
  ALDF: { color: "#e6d3a8", tie: "#2a8a5a", pose: "up", face: "shout",
    top: headband("#ffffff"),
    back: `<rect x="22" y="112" width="44" height="54" rx="12" fill="${STRAW}" ${S}/><path d="M28 124 L60 160 M60 124 L28 160 M22 140 L66 140" stroke="${WOOD}" stroke-width="2.5"/>`,
    front: `<path d="M162 74 Q154 56 162 42 Q172 56 166 74 Z" fill="#f0d9a8" ${S3}/>` +
      `<path d="M164 42 L164 26" stroke="#2a8a5a" stroke-width="4"/><ellipse cx="156" cy="24" rx="7" ry="4" fill="#3fae6e" ${S3}/><ellipse cx="172" cy="24" rx="7" ry="4" fill="#3fae6e" ${S3}/>` +
      `<circle cx="164" cy="16" r="5" fill="${RED}" ${S3}/>` },
  // 정화수 기도꾼: 소반 위 정화수, 초승달과 별
  ALIO: { color: "#f3e6d8", tie: "#8a3b2e", pose: "hold", face: "calm",
    front: `<rect x="66" y="184" width="68" height="8" rx="2" fill="${WOOD}" ${S3}/>` +
      `<path d="M80 168 L120 168 Q116 184 100 184 Q84 184 80 168 Z" fill="#fff" ${S3}/><ellipse cx="100" cy="168" rx="20" ry="4" fill="#bfe3ff" ${S3}/>`,
    extra: `<path d="M38 22 A16 16 0 1 0 50 50 A12 12 0 1 1 38 22 Z" fill="${GOLD}" ${S3}/>` + star(170, 40, 7) + star(184, 70, 5) },
  // 물지게꾼: 상투, 어깨에 물지게, 넘치는 물
  ALIF: { color: "#cfe0f0", tie: BLUE, pose: "down", face: "happy",
    top: sangtu,
    back: bar("M10 134 L190 134", WOOD, 6) +
      `<path d="M22 134 L22 152 M178 134 L178 152" stroke="${INK}" stroke-width="2.5"/>` +
      `<rect x="6" y="150" width="32" height="34" rx="4" fill="#c9a560" ${S}/><ellipse cx="22" cy="152" rx="14" ry="3.5" fill="#7cc4ff" ${S3}/>` +
      `<rect x="162" y="150" width="32" height="34" rx="4" fill="#c9a560" ${S}/><ellipse cx="178" cy="152" rx="14" ry="3.5" fill="#7cc4ff" ${S3}/>`,
    extra: drop(12, 196) + drop(188, 198) + drop(30, 126) },

  // 망나니: 산발, 붉은 머리띠, 큰 칼, 칼에 뿜는 물
  STDO: { color: "#f2c6c0", tie: RED, pose: "up", face: "angry",
    top: `<path d="M60 70 L54 48 L70 56 L72 34 L86 50 L96 28 L106 48 L118 30 L120 52 L136 40 L134 60 L146 60 Q100 40 60 70 Z" fill="${HEAD}" ${S3}/>` + headband(RED),
    front: `<path d="M156 76 L142 16 Q152 2 166 10 L168 76 Z" fill="#e9eef5" ${S3}/><path d="M150 20 L160 70" stroke="#c7cfd9" stroke-width="2"/>` +
      `<ellipse cx="162" cy="78" rx="13" ry="4.5" fill="${GOLD}" ${S3}/>` + bar("M162 84 L165 100", "#6b3d2e", 6),
    extra: drop(132, 18) + drop(122, 34) + drop(128, 2) },
  // 장터 구경꾼: 갓, 곰방대, 연기
  STDF: { color: "#f7e7a6", tie: "#2a8a5a", pose: "down", face: "calm",
    top: gat,
    front: bar("M108 106 L150 176", WOOD, 3) + `<rect x="144" y="168" width="14" height="12" rx="3" fill="#6b6b6b" ${S3}/>`,
    extra: `<circle cx="166" cy="150" r="7" fill="#fff" ${S3}/><circle cx="176" cy="134" r="9" fill="#fff" ${S3}/><circle cx="186" cy="114" r="11" fill="#fff" ${S3}/>` },
  // 엽전 줍는 나무꾼: 흰 머리띠, 등에 진 나뭇짐, 손에 든 엽전
  STIO: { color: "#cde6d3", tie: "#f08a24", pose: "hold", face: "sly",
    top: headband("#ffffff"),
    back: `<path d="M58 206 L66 90 M142 206 L134 90" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M58 206 L66 90 M142 206 L134 90" stroke="${WOOD}" stroke-width="5" stroke-linecap="round"/>` +
      bar("M118 44 L192 94", "#a0703c", 7) + bar("M126 36 L196 82", "#b27e45", 7) + bar("M114 56 L186 104", "#a0703c", 7),
    front: yeopjeon(94, 162) + yeopjeon(108, 170, 8),
    extra: yeopjeon(30, 176, 7) + yeopjeon(46, 190, 6) },
  // 주막 귀동냥꾼: 상투, 귀에 손 대기, 막걸리 사발
  STIF: { color: "#f9d9c4", tie: BLUE, pose: "up", face: "happy",
    top: sangtu,
    front: `<path d="M24 172 L56 172 Q54 190 40 192 Q26 190 24 172 Z" fill="#f5f5f0" ${S3}/><ellipse cx="40" cy="172" rx="16" ry="3.5" fill="#efe6cf" ${S3}/>`,
    extra: `<path d="M174 64 Q182 76 174 88 M182 58 Q194 76 182 94" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>` },

  // 선비: 갓, 턱수염, PER 책
  SLDO: { color: "#f5f5f0", tie: "#4a3a2a", pose: "hold", face: "calm", handsFirst: true,
    top: gat + `<path d="M94 120 Q100 142 106 120 Z" fill="${HEAD}" ${S3}/>`,
    front: `<rect x="76" y="146" width="48" height="36" rx="3" fill="#c94b3c" ${S}/><path d="M100 146 L100 182" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="80" y="154" width="16" height="10" fill="#fff" stroke="${INK}" stroke-width="2"/>` },
  // 보따리 장수: 머리에 인 보따리, 등 뒤 보따리, 손에 든 보따리
  SLDF: { color: "#cde6d3", tie: RED, pose: "hold", face: "grin", handsFirst: true,
    back: `<circle cx="42" cy="134" r="26" fill="#e88a8a" ${S}/><path d="M34 110 L42 118 L50 110" stroke="${INK}" stroke-width="3" fill="none"/>` +
      `<circle cx="158" cy="132" r="26" fill="#8ab0e8" ${S}/><path d="M150 108 L158 116 L166 108" stroke="${INK}" stroke-width="3" fill="none"/>`,
    top: `<ellipse cx="100" cy="42" rx="36" ry="17" fill="${GOLD}" ${S}/><path d="M88 26 L100 34 L112 26 L108 18 L92 18 Z" fill="${GOLD}" ${S3}/>`,
    front: `<circle cx="100" cy="166" r="19" fill="#b98ad6" ${S}/><path d="M90 148 L100 156 L110 148 L106 140 L94 140 Z" fill="#b98ad6" ${S3}/>` },
  // 곳간지기: 쌀가마니, 열쇠 꾸러미
  SLIO: { color: "#e6d3a8", tie: "#8a3b2e", pose: "hold", face: "calm", handsFirst: true,
    top: sangtu,
    front: `<rect x="70" y="140" width="60" height="50" rx="16" fill="${STRAW}" ${S}/>` +
      `<path d="M72 156 Q100 162 128 156 M72 174 Q100 180 128 174" stroke="${WOOD}" stroke-width="2.5" fill="none"/>` +
      `<ellipse cx="94" cy="165" rx="3" ry="2" fill="#fff6e0"/><ellipse cx="102" cy="162" rx="3" ry="2" fill="#fff6e0"/><ellipse cx="106" cy="168" rx="3" ry="2" fill="#fff6e0"/>`,
    extra: `<circle cx="40" cy="150" r="9" fill="none" stroke="${GOLD}" stroke-width="4"/><path d="M40 159 L40 178 M40 172 L46 172 M40 178 L46 178" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>` },
  // 망부석: 산마루 바위 위, 어깨의 이끼
  SLIF: { color: "#c9c4b8", tie: "#6b6b6b", pose: "down", face: "sad",
    top: tanggeon,
    extra: `<path d="M0 202 Q30 168 70 178 Q100 166 130 178 Q170 168 200 202 Z" fill="#9a958a" ${S}/>` +
      `<path d="M30 190 L44 184 M120 186 L136 182 M160 192 L172 186" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` +
      `<ellipse cx="70" cy="140" rx="9" ry="5" fill="#7fb36a" ${S3}/><ellipse cx="128" cy="146" rx="8" ry="4" fill="#7fb36a" ${S3}/>` },
};

function antInner(code) {
  const c = ANTS[code];
  return (c.back || "") + body(c) + arms(c) + head() + FACES[c.face]() + (c.top || "") +
    (c.handsFirst ? hands(c) + (c.front || "") : (c.front || "") + hands(c)) + (c.extra || "");
}

function antSVG(code, cls = "ant") {
  return `<svg class="${cls}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${TYPES[code].name} 캐릭터">${antInner(code)}</svg>`;
}
