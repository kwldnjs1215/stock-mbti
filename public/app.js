(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    name: "",
    index: 0,
    answers: [], // "A" | "B"
    flipped: [], // true면 B 보기를 위에 보여줌
  };

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo({ top: 0 });
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- 퀴즈 ----------
  function startQuiz() {
    state.index = 0;
    state.answers = [];
    state.flipped = QUESTIONS.map(() => Math.random() < 0.5);
    state.done = false;
    renderQuestion();
    show("screen-quiz");
  }

  function renderQuestion() {
    const q = QUESTIONS[state.index];
    const total = QUESTIONS.length;
    const order = state.flipped[state.index] ? ["B", "A"] : ["A", "B"];
    $("q-num").textContent = `Q${state.index + 1}`;
    $("q-text").textContent = q.q;
    order.forEach((choice, i) => {
      const btn = $(`opt-${i}`);
      btn.textContent = q[choice];
      btn.dataset.choice = choice;
      btn.classList.toggle("picked", state.answers[state.index] === choice);
    });
    $("progress-text").textContent = `${state.index + 1}/${total}`;
    $("progress-bar").style.width = `${(state.index / total) * 100}%`;

    const wrap = document.querySelector(".question-wrap");
    wrap.classList.remove("enter");
    void wrap.offsetWidth;
    wrap.classList.add("enter");
  }

  function answer(choice) {
    if (state.done) return;
    document.activeElement.blur();
    state.answers[state.index] = choice;
    if (state.index < QUESTIONS.length - 1) {
      state.index++;
      renderQuestion();
    } else {
      $("progress-bar").style.width = "100%";
      const { code, scores } = calculate();
      state.done = true;
      setTimeout(() => {
        // 새로고침해도 내 결과(점수·답)를 다시 보여줄 수 있게 이 브라우저에만 보관
        try {
          sessionStorage.setItem("lastResult", JSON.stringify({ code, scores, name: state.name, answers: state.answers }));
        } catch {}
        renderResult(code, scores, state.name);
        saveResult(state.name, code, scores);
        history.replaceState(null, "", `?t=${SLUGS[code]}`);
      }, 250);
    }
  }

  function goBack() {
    if (state.index === 0) {
      show("screen-intro");
    } else {
      state.index--;
      renderQuestion();
    }
  }

  // 각 축마다 a 글자를 고른 비율(0~100) 계산
  function calculate() {
    const countA = [0, 0, 0, 0];
    const count = [0, 0, 0, 0];
    QUESTIONS.forEach((q, i) => {
      count[q.axis]++;
      if (state.answers[i] === "A") countA[q.axis]++;
    });
    const scores = count.map((n, i) => Math.round((countA[i] / n) * 100));
    const code = AXES.map((ax, i) => (countA[i] * 2 > count[i] ? ax.a : ax.b)).join("");
    return { code, scores };
  }

  // ---------- 결과 ----------
  function list(id, items) {
    $(id).innerHTML = "";
    items.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      $(id).appendChild(li);
    });
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderMatch(target, kind, code) {
    const t = TYPES[code];
    const other = kind === "best" ? t.best : t.worst;
    const o = TYPES[other];
    const box = $(target);
    box.innerHTML = antSVG(other);
    box.append(
      el("p", "match-kicker", kind === "best" ? "▲ 찰떡 궁합" : "▼ 최악 궁합"),
      el("p", "match-name", o.name),
      el("p", "match-line", kind === "best" ? "같이 투자하면 서로 빈틈을 채워주는 사이" : "같이 투자하면 서로 속 터지는 사이"),
      el("p", "match-scene", kind === "best" ? t.bestScene : t.worstScene),
      el("h4", null, kind === "best" ? "왜 잘 맞냐면" : "왜 파국이냐면")
    );
    const ol = el("ol");
    matchReasons(code, other, kind).forEach((r) => ol.appendChild(el("li", null, r)));
    box.appendChild(ol);
  }

  function renderResult(code, scores, name) {
    const t = TYPES[code];
    if (!t) return show("screen-intro");

    $("report-no").textContent = t.name;
    $("result-char").innerHTML = antSVG(code);
    $("report-hero").style.setProperty("--hero", ANTS[code].color);
    $("result-owner").textContent = name ? `${name}님은` : "이 개미는";
    $("result-name").replaceChildren(el("small", null, "조선의"), t.name);
    $("result-quote").textContent = t.quote;
    $("result-desc").textContent = t.desc;
    $("result-style").textContent = t.style;
    list("style-desc", t.styleDesc);
    list("result-trade", t.trade);
    list("result-mental", t.mental);
    list("result-account", t.account);
    $("result-strength").textContent = t.strength;
    $("result-caution").textContent = t.caution;
    $("result-tip").textContent = t.tip;
    renderMatch("match-good", "best", code);
    renderMatch("match-bad", "worst", code);

    $("btn-retry").textContent = scores ? "다시 하기" : "나도 테스트하기";
    state.shown = { code, name };
    setupJokbo(code, scores);
    show("screen-result");
  }

  // ---------- 엽전 한 닢 족보 (상세 리포트) ----------
  // 결제가 붙기 전까지는 잠겨 있고, 주소 끝에 #preview-report 를 붙이면 미리보기로 열린다
  function setupJokbo(code, scores) {
    $("jokbo-body").classList.add("hidden");
    $("jokbo-lock").classList.remove("hidden");
    const own = Boolean(scores) && state.answers.length === QUESTIONS.length;
    $("btn-unlock").textContent = own ? "🪙 엽전 한 닢으로 열기 · 1,000원" : "직접 테스트하고 내 족보 보기";
    $("jokbo-note").textContent = own ? "결제 기능은 준비 중이에요" : "족보는 테스트를 직접 한 사람만 볼 수 있어요";
    $("btn-unlock").onclick = () => {
      if (!own) {
        history.replaceState(null, "", location.pathname);
        show("screen-intro");
        return;
      }
      if (location.hash === "#preview-report") openJokbo(code, scores);
      else toast("결제 기능은 준비 중이에요. 곧 열려요!");
    };
    if (own && location.hash === "#preview-report") openJokbo(code, scores);
  }

  function openJokbo(code, scores) {
    const t = TYPES[code];
    const body = $("jokbo-body");
    body.innerHTML = "";
    const section = (title) => {
      const s = el("section", "jk-sec");
      s.append(el("h4", null, title));
      body.appendChild(s);
      return s;
    };

    body.append(el("p", "jokbo-kicker", "엽전 한 닢 족보"), el("h3", "jokbo-title", `조선의 ${t.name} 상세 리포트`));

    // 1. 4가지 성향 점수 (scores[i]는 앞 글자를 고른 비율)
    const s1 = section("4가지 성향 점수");
    AXES.forEach((ax, i) => {
      const mine = code[i];
      const pct = mine === ax.a ? scores[i] : 100 - scores[i];
      const level = pct >= 100 ? "이 성향이 아주 뚜렷해요" : pct >= 80 ? "이 성향이 뚜렷해요" : "이쪽으로 살짝 기울어 있어요";
      const row = el("div", "jk-axis");
      const head = el("div", "jk-axis-head");
      head.append(el("span", null, `${ax.aName} ${scores[i]}%`), el("span", null, `${100 - scores[i]}% ${ax.bName}`));
      const bar = el("div", "jk-bar");
      const fill = el("i");
      fill.style.width = `${scores[i]}%`;
      bar.appendChild(fill);
      row.append(head, bar, el("p", null, `${REPORT.lean[mine]}이에요. ${level}.`));
      s1.appendChild(row);
    });

    // 2. 부캐: 50%에 가장 가까운(덜 뚜렷한) 축을 뒤집은 유형
    const s2 = section("나의 부캐");
    const flip = (c, i) => c.slice(0, i) + (c[i] === AXES[i].a ? AXES[i].b : AXES[i].a) + c.slice(i + 1);
    const weakest = [0, 1, 2, 3].sort((a, b) => Math.abs(scores[a] - 50) - Math.abs(scores[b] - 50)).slice(0, 2);
    const subs = el("div", "jk-subs");
    for (const i of weakest) {
      const other = flip(code, i);
      const ax = AXES[i];
      const otherName = other[i] === ax.a ? ax.aName : ax.bName;
      const card = el("div", "jk-sub");
      card.innerHTML = antSVG(other);
      card.append(el("b", null, TYPES[other].name), el("span", null, `${otherName} 쪽이 조금만 강했다면`), el("q", null, TYPES[other].quote));
      subs.appendChild(card);
    }
    s2.appendChild(subs);

    // 3. 상황별 나의 모습
    const s3 = section("시장 상황별 나의 모습");
    const situ = [
      ["폭락장", REPORT.crash[code[0] + code[1]]],
      ["급등장", REPORT.rally[code[1] + code[3]]],
      ["횡보장", REPORT.flat[code[1] + code[2]]],
    ];
    const ul3 = el("ul", "jk-situ");
    for (const [k, v] of situ) {
      const li = el("li");
      li.append(el("b", null, k), el("span", null, v));
      ul3.appendChild(li);
    }
    s3.appendChild(ul3);

    // 4. 내 답으로 보는 근거: 가장 뚜렷한 축 3개에서 내 성향대로 답한 문항 하나씩
    const s4 = section("내 답으로 보는 성향 근거");
    const strongest = [0, 1, 2, 3].sort((a, b) => Math.abs(scores[b] - 50) - Math.abs(scores[a] - 50)).slice(0, 3);
    for (const i of strongest) {
      const ax = AXES[i];
      const choice = code[i] === ax.a ? "A" : "B";
      const qi = QUESTIONS.findIndex((q, n) => q.axis === i && state.answers[n] === choice);
      if (qi < 0) continue;
      const q = QUESTIONS[qi];
      const box = el("div", "jk-ans");
      box.append(
        el("p", "jk-q", `Q${qi + 1}. ${q.q}`),
        el("p", "jk-a", `“${q[choice]}”`),
        el("p", "jk-why", `${choice === "A" ? ax.aName : ax.bName}이 드러난 답이에요.`)
      );
      s4.appendChild(box);
    }

    // 5. 16유형 전체 궁합표
    const s5 = section("16유형 궁합표");
    const LABEL = { 2: "찰떡", 1: "잘 맞음", 0: "무난", "-1": "삐걱", "-2": "최악" };
    const grid = el("div", "jk-grid");
    Object.keys(TYPES)
      .filter((c) => c !== code)
      .map((c) => [c, matchScore(code, c)])
      .sort((a, b) => b[1] - a[1])
      .forEach(([c, sc]) => {
        const cell = el("div", `jk-cell s${sc < 0 ? "m" + -sc : sc}`);
        cell.append(el("b", null, TYPES[c].name), el("span", null, LABEL[sc]));
        grid.appendChild(cell);
      });
    s5.appendChild(grid);

    // 6. 나만의 매매 점검표
    const s6 = section("나만의 매매 점검표");
    const ul6 = el("ul", "jk-check");
    [...code].forEach((ch) => ul6.appendChild(el("li", null, REPORT.check[ch])));
    ul6.appendChild(el("li", null, t.tip));
    s6.appendChild(ul6);

    $("jokbo-lock").classList.add("hidden");
    body.classList.remove("hidden");
  }

  // 이름 + 결과를 서버(Cloudflare D1)에 저장. 실패해도 화면엔 영향 없음
  function saveResult(name, code, scores) {
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: code, scores, answers: state.answers.join("") }),
    }).catch(() => {});
  }

  // 공유 링크의 ?t= 값을 유형 코드로 되돌린다
  function codeFromUrl() {
    const slug = new URLSearchParams(location.search).get("t");
    return Object.keys(SLUGS).find((c) => SLUGS[c] === slug) || null;
  }

  function shareInfo() {
    const { code } = state.shown;
    const url = `${location.origin}${location.pathname}?t=${SLUGS[code]}`;
    const text = `나는 조선의 ${TYPES[code].name}! 너는 어떤 개미야?`;
    return { url, text };
  }

  async function copyLink() {
    const { url, text } = shareInfo();
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast("링크가 복사됐어요! 단톡방에 붙여넣기");
    } catch {
      prompt("아래 링크를 복사하세요", url);
    }
  }

  async function share() {
    const { url, text } = shareInfo();
    if (navigator.share) {
      try {
        await navigator.share({ title: "동학개미 MBTI", text, url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    copyLink();
  }

  // ---------- 이미지로 저장: 1080×1350 공유 카드를 캔버스에 직접 그린다 ----------
  function loadSvg(markup) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
    });
  }

  // 정해진 폭을 넘으면 글자 크기를 줄인다
  function fitText(ctx, text, maxWidth, size, family, weight = "400") {
    let s = size;
    do {
      ctx.font = `${weight} ${s}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      s -= 4;
    } while (s > 20);
    return s;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 줄바꿈: 띄어쓰기 단위로 넘기고, 한 단어가 너무 길면 글자 단위로 자른다
  function wrap(ctx, text, maxWidth) {
    const lines = [];
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth) { line = next; continue; }
      if (line) lines.push(line);
      line = "";
      for (const ch of word) {
        if (ctx.measureText(line + ch).width > maxWidth) { lines.push(line); line = ""; }
        line += ch;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  // 세로로 긴 결과 카드. 내용 높이에 맞춰 캔버스 길이가 정해진다
  async function drawCard() {
    const { code, name } = state.shown;
    const t = TYPES[code];
    const C = {
      ink: "#1d1a16", muted: "#6e6250", body: "#2f2a20", red: "#b8322a", blue: "#2f4a7a", gold: "#f2c14e",
      paper: "#fbf4e2", cream: "#fffaf0", redSoft: "#f6dcd3", blueSoft: "#dbe3ef", hanji: "#f1e6cc", wood: "#6b4423",
    };
    const brush = '"Nanum Brush Script", serif';
    const serif = '"Gowun Batang", serif';
    const sans = '"Pretendard Variable", Pretendard, sans-serif';
    await Promise.all([
      document.fonts.load(`400 120px "Nanum Brush Script"`),
      document.fonts.load(`700 40px "Gowun Batang"`),
      document.fonts.load(`600 32px "Pretendard Variable"`),
    ]).catch(() => {});

    const W = 1080, X = 120, CW = 840;
    const tmp = document.createElement("canvas");
    tmp.width = W;
    tmp.height = 7000;
    const c = tmp.getContext("2d");
    c.textBaseline = "alphabetic";
    let y = 170;

    // 머리글 + 캐릭터
    c.textAlign = "center";
    c.fillStyle = C.ink;
    c.font = `700 40px ${serif}`;
    c.fillText("동학개미 투자 성향", W / 2, y);
    y += 40;
    c.fillStyle = ANTS[code].color;
    c.beginPath();
    c.arc(W / 2, y + 230, 220, 0, Math.PI * 2);
    c.fill();
    const ant = await loadSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="460" height="460">${antInner(code)}</svg>`);
    c.drawImage(ant, W / 2 - 230, y, 460, 460);
    y += 520;

    // ○○님은 / 조선의 ○○
    c.fillStyle = "#4a4232";
    c.font = `700 38px ${serif}`;
    c.fillText(name ? `${name}님은` : "이 개미는", W / 2, y);
    y += 140;
    const prefix = "조선의 ";
    const size = fitText(c, prefix + t.name, 820, 150, brush);
    const small = Math.round(size * 0.55);
    c.font = `400 ${small}px ${brush}`;
    const pw = c.measureText(prefix).width;
    c.font = `400 ${size}px ${brush}`;
    const nw = c.measureText(t.name).width;
    const left = W / 2 - (pw + nw) / 2;
    c.textAlign = "left";
    c.fillStyle = C.muted;
    c.font = `400 ${small}px ${brush}`;
    c.fillText(prefix, left, y);
    c.fillStyle = C.ink;
    c.font = `400 ${size}px ${brush}`;
    c.fillText(t.name, left + pw, y);
    y += 70;

    // 제일 많이 하는 말
    c.font = `700 44px ${serif}`;
    const qLines = wrap(c, t.quote, CW - 80);
    const qh = 80 + qLines.length * 62 + 30;
    c.fillStyle = C.cream;
    c.strokeStyle = C.ink;
    c.lineWidth = 5;
    roundRect(c, X, y, CW, qh, 26);
    c.fill();
    c.stroke();
    c.fillStyle = C.muted;
    c.font = `700 26px ${sans}`;
    c.fillText("제일 많이 하는 말", X + 40, y + 52);
    c.fillStyle = C.ink;
    c.font = `700 44px ${serif}`;
    qLines.forEach((l, i) => c.fillText(l, X + 40, y + 112 + i * 62));
    y += qh + 60;

    // 설명
    c.fillStyle = C.body;
    c.font = `500 32px ${sans}`;
    for (const l of wrap(c, t.desc, CW)) { c.fillText(l, X, y); y += 54; }
    y += 50;

    // 강점 / 주의할 점: 카드 위에 이름표
    for (const [label, color, text] of [["○ 강점", C.blue, t.strength], ["△ 주의할 점", C.red, t.caution]]) {
      c.font = `600 32px ${sans}`;
      const lines = wrap(c, text, CW - 64);
      const h = 50 + lines.length * 52 + 22;
      const top = y + 24;
      c.fillStyle = C.paper;
      c.strokeStyle = C.ink;
      c.lineWidth = 5;
      roundRect(c, X, top, CW, h, 22);
      c.fill();
      c.stroke();
      c.font = `800 26px ${sans}`;
      const tw = c.measureText(label).width + 44;
      c.fillStyle = color;
      roundRect(c, X + 28, y, tw, 48, 24);
      c.fill();
      c.lineWidth = 4;
      c.stroke();
      c.fillStyle = "#fff8e6";
      c.fillText(label, X + 50, y + 34);
      c.fillStyle = C.ink;
      c.font = `600 32px ${sans}`;
      lines.forEach((l, i) => c.fillText(l, X + 32, top + 74 + i * 52));
      y = top + h + 36;
    }

    // 이렇게 해 보세요: 먹색 강조 박스
    c.font = `600 34px ${sans}`;
    const tLines = wrap(c, t.tip, CW - 72);
    const th = 88 + tLines.length * 56 + 30;
    c.fillStyle = C.red;
    roundRect(c, X + 8, y + 8, CW, th, 22);
    c.fill();
    c.fillStyle = C.ink;
    roundRect(c, X, y, CW, th, 22);
    c.fill();
    c.fillStyle = C.gold;
    c.font = `800 28px ${sans}`;
    c.fillText("이렇게 해 보세요", X + 36, y + 58);
    c.fillStyle = "#fff8e6";
    c.font = `600 34px ${sans}`;
    tLines.forEach((l, i) => c.fillText(l, X + 36, y + 116 + i * 56));
    y += th + 110;

    // 같이 투자하면?
    c.textAlign = "center";
    c.fillStyle = C.ink;
    c.font = `400 84px ${brush}`;
    c.fillText("같이 투자하면?", W / 2, y);
    y += 50;
    c.textAlign = "left";
    const pairs = [
      ["▲ 찰떡 궁합", C.red, C.redSoft, t.best, "같이 투자하면 서로 빈틈을 채워주는 사이", t.bestScene],
      ["▼ 최악 궁합", C.blue, C.blueSoft, t.worst, "같이 투자하면 서로 속 터지는 사이", t.worstScene],
    ];
    for (const [kicker, color, bg, other, line, scene] of pairs) {
      const cx = X - 20, cw = CW + 40, pad = 40;
      c.font = `600 30px ${sans}`;
      const sLines = wrap(c, scene, cw - pad * 2 - 48);
      const sh = 36 + sLines.length * 48 + 20;
      const h = 262 + sh + pad;
      c.fillStyle = C.ink;
      roundRect(c, cx + 8, y + 8, cw, h, 26);
      c.fill();
      c.fillStyle = bg;
      c.strokeStyle = C.ink;
      c.lineWidth = 5;
      roundRect(c, cx, y, cw, h, 26);
      c.fill();
      c.stroke();
      const mini = await loadSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="180" height="180">${antInner(other)}</svg>`);
      c.drawImage(mini, cx + cw - 200, y + 14, 180, 180);
      c.font = `800 26px ${sans}`;
      const kw = c.measureText(kicker).width + 36;
      c.fillStyle = color;
      roundRect(c, cx + pad, y + pad, kw, 46, 10);
      c.fill();
      c.fillStyle = "#fff8e6";
      c.fillText(kicker, cx + pad + 18, y + pad + 33);
      c.fillStyle = C.ink;
      const ns = fitText(c, TYPES[other].name, cw - pad * 2 - 200, 76, brush);
      c.font = `400 ${ns}px ${brush}`;
      c.fillText(TYPES[other].name, cx + pad, y + 170);
      c.fillStyle = "#3f3a30";
      c.font = `500 28px ${sans}`;
      c.fillText(line, cx + pad, y + 232);
      const sy = y + 262;
      c.fillStyle = C.cream;
      c.lineWidth = 4;
      roundRect(c, cx + pad, sy, cw - pad * 2, sh, 18);
      c.fill();
      c.stroke();
      c.fillStyle = C.ink;
      c.font = `600 30px ${sans}`;
      sLines.forEach((l, i) => c.fillText(l, cx + pad + 24, sy + 54 + i * 48));
      y += h + 44;
    }

    // 최종 캔버스: 바탕 → 방 종이 → 내용 → 위아래 나무 막대
    const H = y + 130;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = C.hanji;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.ink;
    roundRect(ctx, 76, 96, 940, H - 176, 14);
    ctx.fill();
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 8;
    roundRect(ctx, 60, 80, 940, H - 176, 14);
    ctx.fill();
    ctx.stroke();
    ctx.drawImage(tmp, 0, 0, W, H, 0, 0, W, H);
    ctx.fillStyle = C.wood;
    for (const by of [60, H - 116]) {
      roundRect(ctx, 36, by, 1008, 40, 20);
      ctx.fill();
      ctx.stroke();
    }

    return new Promise((resolve) => cv.toBlob(resolve, "image/png"));
  }

  async function saveImage() {
    const btn = $("btn-image");
    btn.disabled = true;
    try {
      const blob = await drawCard();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `동학개미MBTI_${TYPES[state.shown.code].name.replace(/\s+/g, "")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast("이미지를 저장했어요!");
    } catch {
      toast("이미지를 만들지 못했어요. 다시 시도해 주세요");
    } finally {
      btn.disabled = false;
    }
  }

  // ---------- 이벤트 ----------
  $("name-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.name = $("name-input").value.trim();
    if (!state.name) return;
    startQuiz();
  });
  $("opt-0").onclick = () => answer($("opt-0").dataset.choice);
  $("opt-1").onclick = () => answer($("opt-1").dataset.choice);
  $("btn-back").onclick = goBack;
  $("btn-share").onclick = share;
  $("btn-copy").onclick = copyLink;
  $("btn-image").onclick = saveImage;
  $("btn-retry").onclick = () => {
    history.replaceState(null, "", location.pathname);
    show("screen-intro");
    $("name-input").focus();
  };

  // 시작 화면: 죽창 들고 상승 화살표 아래 모인 동학개미 군단
  function renderHero() {
    const crew = [["ATIO", -4, 96, 124], ["ATDF", 280, 96, 124], ["STDO", 56, 78, 142], ["ALDF", 206, 78, 142], ["SLDO", 114, 36, 184]];
    const spears = [30, 92, 150, 236, 300, 360].map((x) =>
      bar(`M${x} 220 L${x + 12} 34`, "#a7bf72", 4) +
      `<path d="M${x + 6} 40 L${x + 18} 14 L${x + 18} 42 Z" fill="#cfe0a0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`).join("");
    $("hero").innerHTML =
      `<svg class="hero" viewBox="0 0 400 220" aria-hidden="true">` + spears +
      `<path d="M6 150 Q120 196 196 116 T352 44" fill="none" stroke="${INK}" stroke-width="38" stroke-linecap="round"/>` +
      `<path d="M6 150 Q120 196 196 116 T352 44" fill="none" stroke="${RED}" stroke-width="28" stroke-linecap="round"/>` +
      `<path d="M326 20 L396 6 L374 76 Z" fill="${RED}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
      crew.map(([c, x, y, size]) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 200 200">${antInner(c)}</svg>`).join("") +
      `</svg>`;
  }
  renderHero();

  // 문의 메일: 페이지 원본에 주소를 그대로 두지 않아 스팸 수집을 줄인다
  const mail = ["mbti.lab.kr", "gmail.com"].join("@");
  $("contact-mail").href = `mailto:${mail}`;
  $("contact-mail").textContent = mail;

  // 공유 링크로 들어온 경우 (?t=mangnani)
  const shared = codeFromUrl();
  if (shared) {
    let mine = null;
    try { mine = JSON.parse(sessionStorage.getItem("lastResult")); } catch {}
    if (mine && mine.code === shared) {
      state.answers = mine.answers;
      renderResult(shared, mine.scores, mine.name);
    } else {
      renderResult(shared, null, "");
    }
  }
})();
