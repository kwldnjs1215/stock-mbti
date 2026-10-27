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

  async function share() {
    const code = codeFromUrl();
    const t = TYPES[code];
    const url = `${location.origin}${location.pathname}?t=${SLUGS[code]}`;
    const text = `나는 조선의 ${t.name}! 너는 어떤 개미야?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "동학개미 MBTI", text, url });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast("링크가 복사됐어요! 단톡방에 붙여넣기");
    } catch {
      prompt("아래 링크를 복사하세요", url);
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
