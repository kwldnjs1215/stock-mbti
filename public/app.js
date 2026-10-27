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
    show("screen-result");
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

  async function drawCard() {
    const { code, name } = state.shown;
    const t = TYPES[code];
    const W = 1080, H = 1350;
    const brush = '"Nanum Brush Script", serif';
    const serif = '"Gowun Batang", serif';
    await Promise.all([
      document.fonts.load(`400 120px "Nanum Brush Script"`),
      document.fonts.load(`700 40px "Gowun Batang"`),
    ]).catch(() => {});

    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // 바탕(한지)과 방 종이
    ctx.fillStyle = "#f1e6cc";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1d1a16";
    roundRect(ctx, 76, 96, 940, 1180, 14);
    ctx.fill();
    ctx.fillStyle = "#fbf4e2";
    ctx.strokeStyle = "#1d1a16";
    ctx.lineWidth = 8;
    roundRect(ctx, 60, 80, 940, 1180, 14);
    ctx.fill();
    ctx.stroke();
    // 위아래 나무 막대
    ctx.fillStyle = "#6b4423";
    for (const y of [60, 1240]) {
      roundRect(ctx, 36, y, 1008, 40, 20);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = "#1d1a16";
    ctx.font = `700 40px ${serif}`;
    ctx.fillText("동학개미 MBTI", W / 2, 170);

    // 캐릭터
    ctx.fillStyle = ANTS[code].color;
    ctx.beginPath();
    ctx.arc(W / 2, 450, 230, 0, Math.PI * 2);
    ctx.fill();
    const ant = await loadSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="480" height="480">${antInner(code)}</svg>`);
    ctx.drawImage(ant, W / 2 - 240, 210, 480, 480);

    // 누구 / 조선의 ○○
    ctx.fillStyle = "#4a4232";
    ctx.font = `700 40px ${serif}`;
    ctx.fillText(name ? `${name}님은` : "나는", W / 2, 770);
    ctx.fillStyle = "#1d1a16";
    const prefix = "조선의 ";
    const size = fitText(ctx, prefix + t.name, 820, 150, brush);
    ctx.font = `400 ${Math.round(size * 0.55)}px ${brush}`;
    const pw = ctx.measureText(prefix).width;
    ctx.font = `400 ${size}px ${brush}`;
    const nw = ctx.measureText(t.name).width;
    const left = W / 2 - (pw + nw) / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = "#6e6250";
    ctx.font = `400 ${Math.round(size * 0.55)}px ${brush}`;
    ctx.fillText(prefix, left, 910);
    ctx.fillStyle = "#1d1a16";
    ctx.font = `400 ${size}px ${brush}`;
    ctx.fillText(t.name, left + pw, 910);
    ctx.textAlign = "center";

    // 제일 많이 하는 말
    ctx.fillStyle = "#fffaf0";
    ctx.lineWidth = 5;
    roundRect(ctx, 140, 960, 800, 120, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1d1a16";
    const q = `“${t.quote}”`;
    const qs = fitText(ctx, q, 740, 44, serif, "700");
    ctx.font = `700 ${qs}px ${serif}`;
    ctx.fillText(q, W / 2, 1035);

    // 투자 스타일 + 주소
    ctx.fillStyle = "#b8322a";
    ctx.font = `700 36px ${serif}`;
    ctx.fillText(`투자 스타일 · ${t.style}`, W / 2, 1140);
    ctx.fillStyle = "#6e6250";
    ctx.font = `400 30px ${serif}`;
    ctx.fillText(`나도 해보기 → ${location.host}`, W / 2, 1200);

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
  if (shared) renderResult(shared, null, "");
})();
