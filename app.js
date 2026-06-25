const STORAGE_KEY = "lexipaper.entries.v1";
const API_TOKEN_KEY = "lexipaper.apiToken.v1";
const QUIZ_STEPS = [
  { name: "문장 빈칸", hours: 168, levelDelta: 2, label: "매우 쉬움" },
  { name: "첫 글자", hours: 96, levelDelta: 1, label: "쉬움" },
  { name: "뜻 회상", hours: 48, levelDelta: 0, label: "보통" },
  { name: "선택지", hours: 24, levelDelta: -1, label: "어려움" },
  { name: "품사/용례", hours: 6, levelDelta: -2, label: "매우 어려움" },
];
const MISSED_REVIEW_HOURS = 2;

const demoEntries = [
  {
    id: "sample-robust",
    word: "robust",
    partOfSpeech: "adjective",
    meaning: "견고한, 탄탄한; 외부 조건이 바뀌어도 크게 흔들리지 않는",
    sentence:
      "The proposed estimator remains robust under moderate violations of the normality assumption.",
    paperTitle: "A Practical Guide to Robust Estimation",
    page: "p. 14",
    source: "https://doi.org/10.0000/example.robust",
    tags: ["statistics", "method"],
    note: "통계 논문에서는 물리적으로 튼튼하다는 뜻보다 결과가 안정적이라는 뜻으로 자주 쓰임.",
    importance: 5,
    status: "review",
    starred: true,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewLevel: 1,
    dueAt: null,
    lastQuizStep: null,
    reviewCount: 0,
  },
  {
    id: "sample-subsequent",
    word: "subsequent",
    partOfSpeech: "adjective",
    meaning: "그 이후의, 다음의",
    sentence:
      "Subsequent analyses were conducted after excluding observations with incomplete covariates.",
    paperTitle: "Handling Missing Covariates in Observational Studies",
    page: "p. 8",
    source: "",
    tags: ["academic phrase"],
    note: "subsequent analyses, subsequent sections 조합으로 자주 보임.",
    importance: 3,
    status: "new",
    starred: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    reviewedAt: null,
    reviewLevel: 0,
    dueAt: null,
    lastQuizStep: null,
    reviewCount: 0,
  },
];

const state = {
  entries: loadEntries(),
  selectedId: null,
  filter: "all",
  query: "",
  sort: "newest",
  reveal: false,
  editingId: null,
  serverToken: loadServerToken(),
  studyOpen: false,
  studyMode: "due",
  studyIndex: 0,
  studyReveal: false,
  studyStep: 0,
};

const form = document.querySelector("#entryForm");
const wordInput = document.querySelector("#wordInput");
const partInput = document.querySelector("#partInput");
const meaningInput = document.querySelector("#meaningInput");
const sentenceInput = document.querySelector("#sentenceInput");
const zoteroPasteInput = document.querySelector("#zoteroPasteInput");
const zoteroStatus = document.querySelector("#zoteroStatus");
const paperInput = document.querySelector("#paperInput");
const pageInput = document.querySelector("#pageInput");
const sourceInput = document.querySelector("#sourceInput");
const tagsInput = document.querySelector("#tagsInput");
const importanceInput = document.querySelector("#importanceInput");
const noteInput = document.querySelector("#noteInput");
const naverLink = document.querySelector("#naverLink");
const clearFormBtn = document.querySelector("#clearFormBtn");
const exportBtn = document.querySelector("#exportBtn");
const importInput = document.querySelector("#importInput");
const resetBtn = document.querySelector("#resetBtn");
const searchInput = document.querySelector("#searchInput");
const sortInput = document.querySelector("#sortInput");
const wordList = document.querySelector("#wordList");
const detailCard = document.querySelector("#detailCard");
const starBtn = document.querySelector("#starBtn");
const revealBtn = document.querySelector("#revealBtn");
const againBtn = document.querySelector("#againBtn");
const knownBtn = document.querySelector("#knownBtn");
const resultCount = document.querySelector("#resultCount");
const snapshotTitle = document.querySelector("#snapshotTitle");
const statReview = document.querySelector("#statReview");
const statStarred = document.querySelector("#statStarred");
const statPapers = document.querySelector("#statPapers");
const filters = document.querySelectorAll(".filter");
const serverTokenInput = document.querySelector("#serverTokenInput");
const saveServerTokenBtn = document.querySelector("#saveServerTokenBtn");
const pullServerBtn = document.querySelector("#pullServerBtn");
const pushLocalBtn = document.querySelector("#pushLocalBtn");
const syncStatus = document.querySelector("#syncStatus");
const openStudyBtn = document.querySelector("#openStudyBtn");
const openStudyHeroBtn = document.querySelector("#openStudyHeroBtn");
const studyShell = document.querySelector("#studyShell");
const closeStudyBtn = document.querySelector("#closeStudyBtn");
const studyCard = document.querySelector("#studyCard");
const studyCounter = document.querySelector("#studyCounter");
const studyProgressBar = document.querySelector("#studyProgressBar");
const studyRevealBtn = document.querySelector("#studyRevealBtn");
const studyAgainBtn = document.querySelector("#studyAgainBtn");
const studyKnownBtn = document.querySelector("#studyKnownBtn");
const studyTabs = document.querySelectorAll(".study-tab");

if (!state.selectedId && state.entries.length) {
  state.selectedId = state.entries[0].id;
}

bindEvents();
render();
initializeServerSync();
initializeStudyRoute();
registerServiceWorker();

function bindEvents() {
  form.addEventListener("submit", handleSubmit);
  clearFormBtn.addEventListener("click", clearForm);
  wordInput.addEventListener("input", updateNaverLink);
  zoteroPasteInput.addEventListener("paste", handleZoteroPaste);
  [paperInput, pageInput, sourceInput].forEach((input) => {
    input.addEventListener("paste", handleMetadataFieldPaste);
  });
  exportBtn.addEventListener("click", exportEntries);
  importInput.addEventListener("change", importEntries);
  resetBtn.addEventListener("click", resetEntries);
  saveServerTokenBtn.addEventListener("click", saveServerToken);
  pullServerBtn.addEventListener("click", () => pullServerEntries(true));
  pushLocalBtn.addEventListener("click", pushLocalEntries);
  openStudyBtn.addEventListener("click", openStudyMode);
  openStudyHeroBtn.addEventListener("click", openStudyMode);
  closeStudyBtn.addEventListener("click", closeStudyMode);
  studyRevealBtn.addEventListener("click", advanceStudyStep);
  studyAgainBtn.addEventListener("click", handleStudyAnswerButton);
  studyKnownBtn.addEventListener("click", handleStudyKnownButton);
  studyCard.addEventListener("click", handleStudyChoice);
  studyTabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.studyMode = button.dataset.studyMode;
      state.studyIndex = 0;
      state.studyReveal = false;
      state.studyStep = 0;
      renderStudy();
    });
  });
  document.addEventListener("keydown", handleStudyKeys);
  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderList();
  });
  sortInput.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderList();
  });
  filters.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      filters.forEach((item) => item.classList.toggle("active", item === button));
      renderList();
    });
  });
  wordList.addEventListener("click", handleListClick);
  wordList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const selectButton = event.target.closest("[data-select]");
    if (!selectButton) return;
    event.preventDefault();
    selectEntry(selectButton.dataset.select);
  });
  starBtn.addEventListener("click", () => toggleStar(state.selectedId));
  revealBtn.addEventListener("click", () => {
    state.reveal = true;
    renderDetail();
  });
  againBtn.addEventListener("click", () => markStatus("review"));
  knownBtn.addEventListener("click", () => markStatus("mastered"));
}

function handleSubmit(event) {
  event.preventDefault();
  const word = wordInput.value.trim();
  if (!word) return;

  const existing = state.entries.find((entry) => entry.id === state.editingId);
  const entry = {
    id: existing?.id ?? createId(),
    word,
    partOfSpeech: partInput.value,
    meaning: meaningInput.value.trim(),
    sentence: sentenceInput.value.trim(),
    paperTitle: paperInput.value.trim(),
    page: pageInput.value.trim(),
    source: sourceInput.value.trim(),
    tags: parseTags(tagsInput.value),
    note: noteInput.value.trim(),
    importance: Number(importanceInput.value),
    status: existing?.status ?? "new",
    starred: existing?.starred ?? false,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    reviewedAt: existing?.reviewedAt ?? null,
    reviewLevel: existing?.reviewLevel ?? 0,
    dueAt: existing?.dueAt ?? null,
    lastQuizStep: existing?.lastQuizStep ?? null,
    reviewCount: existing?.reviewCount ?? 0,
  };

  if (existing) {
    state.entries = state.entries.map((item) => (item.id === entry.id ? entry : item));
  } else {
    state.entries = [entry, ...state.entries];
  }

  state.selectedId = entry.id;
  state.reveal = false;
  state.editingId = null;
  persist();
  clearForm();
  render();
  saveEntryRemote(entry);
}

function clearForm() {
  state.editingId = null;
  form.reset();
  zoteroStatus.textContent = "";
  zoteroStatus.className = "paste-status";
  importanceInput.value = "3";
  updateNaverLink();
}

function handleZoteroPaste(event) {
  const text = readClipboardText(event);
  if (!text) return;
  event.preventDefault();
  zoteroPasteInput.value = text;
  applyZoteroMetadata(parseZoteroPayload(text));
}

function handleMetadataFieldPaste(event) {
  const text = readClipboardText(event);
  if (!looksLikeZoteroPayload(text)) return;
  event.preventDefault();
  zoteroPasteInput.value = text;
  applyZoteroMetadata(parseZoteroPayload(text));
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const starterEntries = window.location.protocol === "file:" ? demoEntries : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterEntries));
      return starterEntries;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : demoEntries;
  } catch {
    return demoEntries;
  }
}

function loadServerToken() {
  try {
    return localStorage.getItem(API_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function normalizeEntry(entry) {
  return {
    id: String(entry.id ?? createId()),
    word: String(entry.word ?? "").trim(),
    partOfSpeech: String(entry.partOfSpeech ?? ""),
    meaning: String(entry.meaning ?? ""),
    sentence: String(entry.sentence ?? ""),
    paperTitle: String(entry.paperTitle ?? ""),
    page: String(entry.page ?? ""),
    source: String(entry.source ?? ""),
    tags: Array.isArray(entry.tags) ? entry.tags.map(String) : parseTags(entry.tags ?? ""),
    note: String(entry.note ?? ""),
    importance: clamp(Number(entry.importance ?? 3), 1, 5),
    status: ["new", "review", "mastered"].includes(entry.status) ? entry.status : "new",
    starred: Boolean(entry.starred),
    createdAt: entry.createdAt ?? new Date().toISOString(),
    reviewedAt: entry.reviewedAt ?? null,
    reviewLevel: clamp(Number(entry.reviewLevel ?? 0), 0, 5),
    dueAt: entry.dueAt ?? null,
    lastQuizStep: entry.lastQuizStep ? clamp(Number(entry.lastQuizStep), 1, 5) : null,
    reviewCount: Math.max(0, Number(entry.reviewCount ?? 0) || 0),
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries.map(normalizeEntry)));
}

function initializeStudyRoute() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("review") === "1" || window.location.hash === "#review") {
    openStudyMode();
  }
}

function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || window.location.protocol === "file:") return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

function isHostedApp() {
  return window.location.protocol !== "file:";
}

function hasServerToken() {
  return Boolean(state.serverToken.trim());
}

function serverHeaders() {
  return {
    Authorization: `Bearer ${state.serverToken.trim()}`,
    "Content-Type": "application/json",
  };
}

async function serverRequest(path, options = {}) {
  if (!isHostedApp()) {
    throw new Error("LexiPaper is currently open as a local file.");
  }

  if (!hasServerToken()) {
    throw new Error("Server token is missing.");
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      ...serverHeaders(),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || response.statusText);
  }

  return data;
}

function initializeServerSync() {
  serverTokenInput.value = state.serverToken;
  if (!isHostedApp()) {
    setSyncStatus("로컬 저장", "");
    return;
  }

  if (!hasServerToken()) {
    setSyncStatus("토큰 필요", "warning");
    return;
  }

  pullServerEntries(false);
}

async function saveServerToken() {
  state.serverToken = serverTokenInput.value.trim();
  if (state.serverToken) {
    localStorage.setItem(API_TOKEN_KEY, state.serverToken);
    setSyncStatus("연결 확인 중", "");
    await pullServerEntries(false);
  } else {
    localStorage.removeItem(API_TOKEN_KEY);
    setSyncStatus(isHostedApp() ? "토큰 필요" : "로컬 저장", isHostedApp() ? "warning" : "");
  }
}

async function pullServerEntries(showSuccess) {
  try {
    const data = await serverRequest("/api/entries");
    state.entries = Array.isArray(data.entries) ? data.entries.map(normalizeEntry) : [];
    state.selectedId = state.entries[0]?.id ?? null;
    state.reveal = false;
    persist();
    render();
    if (showSuccess !== false) setSyncStatus("서버에서 불러옴", "success");
    if (showSuccess === false) setSyncStatus("서버 연결됨", "success");
  } catch (error) {
    setSyncStatus(syncErrorMessage(error), "warning");
  }
}

async function pushLocalEntries() {
  try {
    const data = await serverRequest("/api/entries", {
      method: "POST",
      body: JSON.stringify({ entries: state.entries }),
    });
    state.entries = Array.isArray(data.entries) ? data.entries.map(normalizeEntry) : state.entries;
    state.selectedId = state.selectedId ?? state.entries[0]?.id ?? null;
    persist();
    render();
    setSyncStatus("서버에 올림", "success");
  } catch (error) {
    setSyncStatus(syncErrorMessage(error), "warning");
  }
}

async function saveEntryRemote(entry) {
  if (!isHostedApp() || !hasServerToken()) return;
  try {
    await serverRequest("/api/entries", {
      method: "POST",
      body: JSON.stringify({ entry }),
    });
    setSyncStatus("서버 저장됨", "success");
  } catch (error) {
    setSyncStatus(syncErrorMessage(error), "warning");
  }
}

async function deleteEntryRemote(id) {
  if (!isHostedApp() || !hasServerToken()) return;
  try {
    await serverRequest(`/api/entries?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setSyncStatus("서버에서 삭제됨", "success");
  } catch (error) {
    setSyncStatus(syncErrorMessage(error), "warning");
  }
}

function setSyncStatus(message, kind) {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status${kind ? ` ${kind}` : ""}`;
}

function syncErrorMessage(error) {
  if (String(error.message || "").includes("local file")) return "배포 후 서버 연결";
  if (String(error.message || "").includes("token")) return "토큰 필요";
  if (String(error.message || "").includes("Unauthorized")) return "토큰 확인";
  return "서버 연결 실패";
}

function render() {
  renderStats();
  renderList();
  renderDetail();
  renderStudy();
}

function renderStats() {
  const total = state.entries.length;
  const review = state.entries.filter(isDueEntry).length;
  const starred = state.entries.filter((entry) => entry.starred).length;
  const papers = new Set(
    state.entries
      .map((entry) => entry.paperTitle.trim().toLowerCase())
      .filter(Boolean),
  ).size;

  snapshotTitle.textContent = `${total}개 저장됨`;
  statReview.textContent = String(review);
  statStarred.textContent = String(starred);
  statPapers.textContent = String(papers);
}

function renderList() {
  const entries = getVisibleEntries();
  resultCount.textContent = String(entries.length);
  wordList.replaceChildren();

  if (!entries.length) {
    wordList.append(document.querySelector("#emptyTemplate").content.cloneNode(true));
    return;
  }

  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = `word-item${entry.id === state.selectedId ? " active" : ""}`;

    const tags = entry.tags
      .slice(0, 3)
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    article.innerHTML = `
      <div class="word-main">
        <button class="word-select" type="button" data-select="${escapeHtml(entry.id)}">
          <span class="word-title">
            <strong>${escapeHtml(entry.word)}</strong>
            <small>${escapeHtml(entry.partOfSpeech || statusLabel(entry.status))}</small>
          </span>
        </button>
        <div class="item-actions">
          <button class="tiny-button${entry.starred ? " starred" : ""}" type="button" data-star="${escapeHtml(entry.id)}" aria-label="중요 표시" title="중요 표시">
            ${starIcon()}
          </button>
          <button class="tiny-button" type="button" data-edit="${escapeHtml(entry.id)}" aria-label="편집" title="편집">
            ${editIcon()}
          </button>
          <button class="tiny-button" type="button" data-delete="${escapeHtml(entry.id)}" aria-label="삭제" title="삭제">
            ${trashIcon()}
          </button>
        </div>
      </div>
      <p class="word-meaning">${escapeHtml(entry.meaning || entry.sentence || "내용 없음")}</p>
      <div class="word-meta">
        <span class="status-pill ${entry.status === "mastered" ? "mastered" : "review"}">${statusLabel(entry.status)}</span>
        ${tags}
      </div>
    `;
    fragment.append(article);
  });

  wordList.append(fragment);
}

function renderDetail() {
  const entry = getSelectedEntry();
  const disabled = !entry;
  [starBtn, revealBtn, againBtn, knownBtn].forEach((button) => {
    button.disabled = disabled;
  });
  starBtn.classList.toggle("starred", Boolean(entry?.starred));

  if (!entry) {
    detailCard.innerHTML = `<div class="empty-state"><p>선택된 단어가 없습니다.</p></div>`;
    return;
  }

  const meaning = state.reveal
    ? escapeHtml(entry.meaning || "저장된 뜻 없음")
    : `<span class="muted-text">뜻 숨김</span>`;
  const sentence = entry.sentence
    ? blankSentence(entry.sentence, entry.word, !state.reveal)
    : "저장된 예문 없음";
  const source = sourceMarkup(entry);
  const tags = entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");

  detailCard.innerHTML = `
    <div class="card-word">
      <div>
        <h3>${escapeHtml(entry.word)}</h3>
        <p>${escapeHtml(entry.partOfSpeech || statusLabel(entry.status))}</p>
      </div>
      <span class="importance" aria-label="중요도 ${entry.importance}">${"●".repeat(entry.importance)}</span>
    </div>
    <div class="meaning-box">
      <h4>뜻</h4>
      <p>${meaning}</p>
    </div>
    <div class="sentence-box">
      <h4>논문 예문</h4>
      <blockquote>${sentence}</blockquote>
    </div>
    <div class="source-box">
      <h4>출처</h4>
      ${source}
    </div>
    ${
      entry.note
        ? `<div class="note-box"><h4>메모</h4><p>${escapeHtml(entry.note)}</p></div>`
        : ""
    }
    ${tags ? `<div class="word-meta">${tags}</div>` : ""}
  `;
}

function handleListClick(event) {
  const selectButton = event.target.closest("[data-select]");
  const starButton = event.target.closest("[data-star]");
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (selectButton) selectEntry(selectButton.dataset.select);
  if (starButton) toggleStar(starButton.dataset.star);
  if (editButton) editEntry(editButton.dataset.edit);
  if (deleteButton) deleteEntry(deleteButton.dataset.delete);
}

function selectEntry(id) {
  state.selectedId = id;
  state.reveal = false;
  renderList();
  renderDetail();
}

function toggleStar(id) {
  if (!id) return;
  let updatedEntry = null;
  state.entries = state.entries.map((entry) =>
    entry.id === id
      ? (updatedEntry = { ...entry, starred: !entry.starred })
      : entry,
  );
  persist();
  render();
  if (updatedEntry) saveEntryRemote(updatedEntry);
}

function editEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  state.editingId = id;
  state.selectedId = id;
  wordInput.value = entry.word;
  partInput.value = entry.partOfSpeech;
  meaningInput.value = entry.meaning;
  sentenceInput.value = entry.sentence;
  paperInput.value = entry.paperTitle;
  pageInput.value = entry.page;
  sourceInput.value = entry.source;
  tagsInput.value = entry.tags.join(", ");
  importanceInput.value = entry.importance;
  noteInput.value = entry.note;
  updateNaverLink();
  render();
  wordInput.focus();
}

function deleteEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  const ok = confirm(`"${entry.word}"을 삭제할까요?`);
  if (!ok) return;
  state.entries = state.entries.filter((item) => item.id !== id);
  if (state.selectedId === id) {
    state.selectedId = state.entries[0]?.id ?? null;
  }
  persist();
  render();
  deleteEntryRemote(id);
}

function markStatus(status) {
  const id = state.selectedId;
  if (!id) return;
  const updatedEntry = updateEntryStatus(id, status);
  state.reveal = status === "mastered";
  render();
  if (updatedEntry) saveEntryRemote(updatedEntry);
}

function updateEntryStatus(id, status) {
  const reviewedAt = new Date().toISOString();
  let updatedEntry = null;
  state.entries = state.entries.map((entry) => {
    if (entry.id !== id) return entry;
    const reviewLevel = clamp(Number(entry.reviewLevel || 0) + (status === "mastered" ? 1 : -1), 0, 5);
    updatedEntry = {
      ...entry,
      status,
      reviewedAt,
      reviewLevel,
      dueAt: status === "mastered" ? nextDueAt(168 + reviewLevel * 24) : null,
      reviewCount: Number(entry.reviewCount || 0) + 1,
    };
    return updatedEntry;
  });
  persist();
  return updatedEntry;
}

function openStudyMode() {
  state.studyOpen = true;
  state.studyReveal = false;
  state.studyStep = 0;
  document.body.classList.add("study-active");
  studyShell.classList.add("active");
  studyShell.setAttribute("aria-hidden", "false");
  renderStudy();
}

function closeStudyMode() {
  state.studyOpen = false;
  document.body.classList.remove("study-active");
  studyShell.classList.remove("active");
  studyShell.setAttribute("aria-hidden", "true");
}

function revealStudyAnswer() {
  state.studyReveal = true;
  renderStudy();
}

function advanceStudyStep() {
  const entry = getCurrentStudyEntry();
  if (!entry) return;

  if (state.studyReveal) return;

  if (state.studyStep < QUIZ_STEPS.length - 1) {
    state.studyStep += 1;
    renderStudy();
    return;
  }

  revealStudyAnswer();
}

function handleStudyAnswerButton() {
  const entry = getCurrentStudyEntry();
  if (!entry) return;

  if (state.studyReveal) {
    markStudyMissed();
    return;
  }

  revealStudyAnswer();
}

function handleStudyKnownButton() {
  const entry = getCurrentStudyEntry();
  if (!entry) return;

  if (state.studyReveal) {
    markStudyMissed();
    return;
  }

  completeStudyCard();
}

function handleStudyChoice(event) {
  const choice = event.target.closest("[data-choice]");
  if (!choice || state.studyReveal || state.studyStep !== 3) return;

  if (choice.dataset.correct === "true") {
    completeStudyCard();
    return;
  }

  state.studyStep = Math.min(QUIZ_STEPS.length - 1, state.studyStep + 1);
  renderStudy();
}

function completeStudyCard() {
  const entry = getCurrentStudyEntry();
  if (!entry) return;
  const updatedEntry = applyStudyResult(entry.id, buildReviewResult(entry, state.studyStep));
  moveAfterStudyResult(updatedEntry);
}

function markStudyMissed() {
  const entry = getCurrentStudyEntry();
  if (!entry) return;
  const updatedEntry = applyStudyResult(entry.id, buildReviewResult(entry, QUIZ_STEPS.length));
  moveAfterStudyResult(updatedEntry);
}

function moveAfterStudyResult(updatedEntry) {
  const removesCurrentCard = state.studyMode === "due";
  state.studyReveal = false;
  state.studyStep = 0;
  moveToNextStudyCard(removesCurrentCard);
  render();
  if (updatedEntry) saveEntryRemote(updatedEntry);
}

function applyStudyResult(id, result) {
  let updatedEntry = null;
  state.entries = state.entries.map((entry) =>
    entry.id === id ? (updatedEntry = { ...entry, ...result }) : entry,
  );
  persist();
  return updatedEntry;
}

function buildReviewResult(entry, stepIndex) {
  const reviewedAt = new Date().toISOString();
  const currentLevel = clamp(Number(entry.reviewLevel || 0), 0, 5);
  const reviewCount = Number(entry.reviewCount || 0) + 1;

  if (stepIndex >= QUIZ_STEPS.length) {
    return {
      status: "review",
      reviewedAt,
      reviewLevel: clamp(currentLevel - 2, 0, 5),
      dueAt: nextDueAt(MISSED_REVIEW_HOURS),
      lastQuizStep: QUIZ_STEPS.length,
      reviewCount,
    };
  }

  const step = QUIZ_STEPS[stepIndex];
  const nextLevel = clamp(currentLevel + step.levelDelta, 0, 5);
  const intervalHours = Math.max(2, Math.round(step.hours * (1 + nextLevel * 0.18)));

  return {
    status: "mastered",
    reviewedAt,
    reviewLevel: nextLevel,
    dueAt: nextDueAt(intervalHours),
    lastQuizStep: stepIndex + 1,
    reviewCount,
  };
}

function moveToNextStudyCard(removesCurrentCard) {
  const queue = getStudyQueue();
  if (!queue.length) {
    state.studyIndex = 0;
    state.studyStep = 0;
    state.studyReveal = false;
    return;
  }
  const nextIndex = removesCurrentCard ? state.studyIndex : state.studyIndex + 1;
  state.studyIndex = removesCurrentCard
    ? Math.min(nextIndex, queue.length - 1)
    : nextIndex >= queue.length
      ? 0
      : nextIndex;
  state.studyStep = 0;
  state.studyReveal = false;
}

function handleStudyKeys(event) {
  if (!state.studyOpen) return;
  const tagName = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) return;

  if (event.key === "Escape") {
    closeStudyMode();
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    advanceStudyStep();
  }

  if (event.key === "Enter") {
    event.preventDefault();
    handleStudyKnownButton();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    handleStudyAnswerButton();
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    handleStudyKnownButton();
  }
}

function getStudyQueue() {
  const entries = state.entries.filter((entry) => entry.word && (entry.meaning || entry.sentence));
  const filtered = entries.filter((entry) => {
    if (state.studyMode === "starred") return entry.starred;
    if (state.studyMode === "all") return true;
    return isDueEntry(entry);
  });

  return filtered.sort((a, b) => {
    const aDue = isDueEntry(a);
    const bDue = isDueEntry(b);
    if (aDue !== bDue) return aDue ? -1 : 1;
    const aDueTime = reviewDueTime(a);
    const bDueTime = reviewDueTime(b);
    if (aDueTime !== bDueTime) return aDueTime - bDueTime;
    if (a.status !== b.status) {
      if (a.status === "review") return -1;
      if (b.status === "review") return 1;
      if (a.status === "new") return -1;
      if (b.status === "new") return 1;
    }
    if (a.starred !== b.starred) return a.starred ? -1 : 1;
    if (a.importance !== b.importance) return b.importance - a.importance;
    return new Date(a.reviewedAt || a.createdAt) - new Date(b.reviewedAt || b.createdAt);
  });
}

function getCurrentStudyEntry() {
  const queue = getStudyQueue();
  if (!queue.length) return null;
  if (state.studyIndex >= queue.length) state.studyIndex = Math.max(0, queue.length - 1);
  return queue[state.studyIndex] ?? null;
}

function renderStudy() {
  studyTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.studyMode === state.studyMode);
  });

  const queue = getStudyQueue();
  const entry = getCurrentStudyEntry();
  const total = queue.length;
  const current = entry ? state.studyIndex + 1 : 0;
  const progress = total ? (current / total) * 100 : 0;

  studyCounter.textContent = `${current} / ${total}`;
  studyProgressBar.style.width = `${progress}%`;

  [studyRevealBtn, studyAgainBtn, studyKnownBtn].forEach((button) => {
    button.disabled = !entry;
  });
  studyRevealBtn.disabled = !entry || state.studyReveal;
  studyAgainBtn.disabled = !entry;
  studyKnownBtn.disabled = !entry;

  if (!entry) {
    studyCard.className = "study-card empty";
    studyCard.innerHTML = `
      <div>
        <p class="section-kicker">Done</p>
        <h3>오늘 볼 카드가 없어요</h3>
        <p class="study-pos">전체 탭을 누르면 완료한 카드까지 다시 볼 수 있습니다.</p>
      </div>
    `;
    return;
  }

  studyCard.className = "study-card";
  const step = QUIZ_STEPS[state.studyStep] ?? QUIZ_STEPS[QUIZ_STEPS.length - 1];
  const tags = entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const heading = state.studyReveal ? entry.word : `${step.name} 퀴즈`;
  const subheading = state.studyReveal
    ? entry.partOfSpeech || difficultyLabel(entry)
    : `${step.label} · ${reviewPreviewText(state.studyStep)}`;

  setButtonLabel(studyRevealBtn, state.studyStep < QUIZ_STEPS.length - 1 ? "모르면 다음 힌트" : "모르면 정답");
  setButtonLabel(studyAgainBtn, state.studyReveal ? "오늘 다시" : "정답 보기");
  setButtonLabel(studyKnownBtn, state.studyReveal ? "다음 카드" : "맞혔어요");

  studyCard.innerHTML = `
    <div class="quiz-stepper" aria-label="힌트 단계">
      ${QUIZ_STEPS.map(
        (item, index) =>
          `<span class="quiz-step${index === state.studyStep ? " active" : ""}${index < state.studyStep ? " done" : ""}" title="${escapeHtml(item.name)}">${index + 1}</span>`,
      ).join("")}
    </div>
    <div class="study-word">
      <div>
        <h3>${escapeHtml(heading)}</h3>
        <p class="study-pos">${escapeHtml(subheading)}</p>
      </div>
      <span class="status-pill ${isDueEntry(entry) ? "review" : "mastered"} study-status">${reviewTimingLabel(entry)}</span>
    </div>
    ${state.studyReveal ? studyAnswerMarkup(entry) : studyPromptMarkup(entry)}
    ${tags ? `<div class="word-meta">${tags}</div>` : ""}
  `;
}

function studyPromptMarkup(entry) {
  const sentence = entry.sentence
    ? blankSentence(entry.sentence, entry.word, true)
    : `<span class="muted-text">저장된 예문 없음</span>`;

  if (state.studyStep === 1) {
    return `
      <div class="study-block">
        <h4>논문 예문</h4>
        <blockquote>${sentence}</blockquote>
      </div>
      <div class="study-block">
        <h4>첫 글자</h4>
        <p class="letter-hint">${escapeHtml(firstLetterHint(entry.word))}</p>
      </div>
    `;
  }

  if (state.studyStep === 2) {
    return `
      <div class="study-block">
        <h4>한국어 뜻</h4>
        <p class="study-meaning">${escapeHtml(entry.meaning || "저장된 뜻 없음")}</p>
      </div>
      <div class="study-block">
        <h4>논문 예문</h4>
        <blockquote>${sentence}</blockquote>
      </div>
    `;
  }

  if (state.studyStep === 3) {
    return `
      <div class="study-block">
        <h4>논문 예문</h4>
        <blockquote>${sentence}</blockquote>
      </div>
      <div class="study-block">
        <h4>보기</h4>
        <div class="choice-grid">
          ${choiceOptions(entry)
            .map(
              (option) =>
                `<button class="choice-button" type="button" data-choice="${escapeHtml(option)}" data-correct="${String(option.toLowerCase() === entry.word.toLowerCase())}">${escapeHtml(option)}</button>`,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (state.studyStep === 4) {
    return `
      <div class="study-block">
        <h4>논문 예문</h4>
        <blockquote>${sentence}</blockquote>
      </div>
      <div class="hint-grid">
        <div class="hint-box">
          <h4>품사</h4>
          <p>${escapeHtml(entry.partOfSpeech || "품사 없음")}</p>
        </div>
        <div class="hint-box">
          <h4>용례</h4>
          <p>${escapeHtml(entry.note || entry.meaning || "저장된 용례 없음")}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="study-block">
      <h4>논문 예문</h4>
      <blockquote>${sentence}</blockquote>
    </div>
  `;
}

function studyAnswerMarkup(entry) {
  const source = [entry.paperTitle, entry.page].filter(Boolean).join(" · ");
  const note = entry.note ? `<div class="study-block"><h4>메모</h4><p>${escapeHtml(entry.note)}</p></div>` : "";

  return `
    <div class="answer-banner">
      <span>정답</span>
      <strong>${escapeHtml(entry.word)}</strong>
    </div>
    <div class="study-block">
      <h4>뜻</h4>
      <p class="study-meaning">${escapeHtml(entry.meaning || "저장된 뜻 없음")}</p>
    </div>
    <div class="study-block">
      <h4>논문 예문</h4>
      <blockquote>${entry.sentence ? blankSentence(entry.sentence, entry.word, false) : "저장된 예문 없음"}</blockquote>
    </div>
    ${
      source
        ? `<div class="study-block"><h4>출처</h4><p>${escapeHtml(source)}</p></div>`
        : ""
    }
    ${note}
  `;
}

function choiceOptions(entry) {
  const words = state.entries
    .map((item) => item.word)
    .filter((word) => word && word.toLowerCase() !== entry.word.toLowerCase());
  const fallback = ["analysis", "evidence", "method", "significant", "subsequent", "robust"];
  const candidates = uniqueWords([...words, ...fallback]).filter(
    (word) => word.toLowerCase() !== entry.word.toLowerCase(),
  );
  return shuffleWords([entry.word, ...shuffleWords(candidates).slice(0, 3)]);
}

function uniqueWords(words) {
  const seen = new Set();
  return words.filter((word) => {
    const key = word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shuffleWords(words) {
  return [...words].sort(() => Math.random() - 0.5);
}

function firstLetterHint(word) {
  const trimmed = String(word || "").trim();
  if (!trimmed) return "";
  return `${trimmed[0]}${"·".repeat(Math.max(2, trimmed.length - 1))}`;
}

function setButtonLabel(button, label) {
  const icon = button.querySelector("svg")?.outerHTML ?? "";
  button.innerHTML = `${icon}${escapeHtml(label)}`;
}

function nextDueAt(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function reviewDueTime(entry) {
  if (!entry.dueAt) return entry.status === "mastered" ? Number.MAX_SAFE_INTEGER : 0;
  const time = new Date(entry.dueAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isDueEntry(entry) {
  if (!entry?.word) return false;
  const dueTime = reviewDueTime(entry);
  if (dueTime === Number.MAX_SAFE_INTEGER) return false;
  return dueTime <= Date.now();
}

function reviewTimingLabel(entry) {
  if (isDueEntry(entry)) return "지금 복습";
  if (!entry.dueAt) return statusLabel(entry.status);
  const diffHours = Math.ceil((reviewDueTime(entry) - Date.now()) / 3600000);
  if (diffHours <= 1) return "1시간 뒤";
  if (diffHours < 24) return `${diffHours}시간 뒤`;
  return `${Math.ceil(diffHours / 24)}일 뒤`;
}

function reviewPreviewText(stepIndex) {
  const step = QUIZ_STEPS[stepIndex] ?? QUIZ_STEPS[QUIZ_STEPS.length - 1];
  if (step.hours < 24) return `${step.hours}시간 뒤 복습`;
  return `${Math.round(step.hours / 24)}일 뒤 복습`;
}

function difficultyLabel(entry) {
  const step = entry.lastQuizStep ? QUIZ_STEPS[entry.lastQuizStep - 1] : null;
  return step ? step.label : statusLabel(entry.status);
}

function getSelectedEntry() {
  return state.entries.find((entry) => entry.id === state.selectedId) ?? null;
}

function getVisibleEntries() {
  const query = state.query;
  return state.entries
    .filter((entry) => {
      if (state.filter === "review" && !isDueEntry(entry)) return false;
      if (state.filter === "starred" && !entry.starred) return false;
      if (state.filter === "mastered" && entry.status !== "mastered") return false;
      if (!query) return true;
      return [
        entry.word,
        entry.meaning,
        entry.sentence,
        entry.paperTitle,
        entry.tags.join(" "),
        entry.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      if (state.sort === "word") return a.word.localeCompare(b.word);
      if (state.sort === "importance") return b.importance - a.importance;
      if (state.sort === "paper") return a.paperTitle.localeCompare(b.paperTitle);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function updateNaverLink() {
  const word = wordInput.value.trim();
  naverLink.href = word
    ? `https://en.dict.naver.com/#/search?query=${encodeURIComponent(word)}`
    : "https://en.dict.naver.com/";
}

function exportEntries() {
  const data = {
    app: "LexiPaper",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: state.entries.map(normalizeEntry),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lexipaper-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importEntries(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const entries = Array.isArray(parsed) ? parsed : parsed.entries;
      if (!Array.isArray(entries)) throw new Error("Invalid LexiPaper data");
      state.entries = entries.map(normalizeEntry).filter((entry) => entry.word);
      state.selectedId = state.entries[0]?.id ?? null;
      state.reveal = false;
      persist();
      render();
    } catch {
      alert("가져올 수 없는 파일입니다.");
    } finally {
      importInput.value = "";
    }
  };
  reader.readAsText(file);
}

function resetEntries() {
  const ok = confirm("단어장을 모두 비울까요?");
  if (!ok) return;
  state.entries = [];
  state.selectedId = null;
  state.reveal = false;
  state.editingId = null;
  persist();
  clearForm();
  render();
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function readClipboardText(event) {
  const plain = event.clipboardData?.getData("text/plain") ?? "";
  const html = event.clipboardData?.getData("text/html") ?? "";
  return [plain, stripHtml(html)].filter(Boolean).join("\n").trim();
}

function stripHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() ?? "";
}

function applyZoteroMetadata(metadata) {
  const filled = [];
  const skipped = [];
  fillIfEmpty(paperInput, metadata.title, "제목", filled, skipped);
  fillIfEmpty(sourceInput, metadata.source, "DOI", filled, skipped);
  fillIfEmpty(pageInput, metadata.page, "페이지", filled, skipped);

  if (filled.length) {
    zoteroStatus.textContent = `${filled.join(", ")} 채움`;
    zoteroStatus.className = "paste-status success";
    return;
  }

  if (skipped.length) {
    zoteroStatus.textContent = `${skipped.join(", ")} 이미 입력됨`;
    zoteroStatus.className = "paste-status";
    return;
  }

  zoteroStatus.textContent = "가져올 항목 없음";
  zoteroStatus.className = "paste-status warning";
}

function fillIfEmpty(input, value, label, filled, skipped) {
  if (!value) return;
  if (input.value.trim()) {
    skipped.push(label);
    return;
  }
  input.value = value;
  filled.push(label);
}

function looksLikeZoteroPayload(text) {
  if (!text) return false;
  return /@\w+\s*\{|^TY\s+-|^TI\s+-|^T1\s+-|10\.\d{4,9}\//im.test(text);
}

function parseZoteroPayload(rawText) {
  const text = cleanZoteroText(rawText);
  const sources = [
    parseCslJson(text),
    parseBibtex(text),
    parseRis(text),
    parseCitationText(text),
  ];
  const title = firstValue(sources.map((source) => source.title));
  const doi = normalizeDoi(firstValue(sources.map((source) => source.doi)));
  const url = firstValue(sources.map((source) => source.url));
  const page = normalizePage(firstValue(sources.map((source) => source.page)));

  return {
    title,
    source: doi ? `https://doi.org/${doi}` : url,
    page,
  };
}

function parseCslJson(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return {};

  try {
    const parsed = JSON.parse(trimmed);
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!item || typeof item !== "object") return {};
    return {
      title: item.title,
      doi: item.DOI ?? item.doi,
      url: item.URL ?? item.url,
      page: item.page,
    };
  } catch {
    return {};
  }
}

function parseBibtex(text) {
  if (!/@\w+\s*\{/.test(text)) return {};
  return {
    title: getBibField(text, ["title"]),
    doi: getBibField(text, ["doi"]),
    url: getBibField(text, ["url"]),
    page: getBibField(text, ["pages", "page"]),
  };
}

function getBibField(text, names) {
  const namePattern = names.join("|");
  const regex = new RegExp(
    `(?:^|[\\n,])\\s*(?:${namePattern})\\s*=\\s*([\\s\\S]*?)(?=,\\s*\\n\\s*[a-zA-Z]+\\s*=|\\n\\s*\\})`,
    "i",
  );
  const match = text.match(regex);
  return match ? cleanFieldValue(match[1]) : "";
}

function parseRis(text) {
  if (!/^TY\s+-/im.test(text) && !/^T[1I]\s+-/im.test(text)) return {};
  const fields = {};
  text.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z0-9]{2})\s+-\s*(.+)$/);
    if (!match) return;
    const [, key, value] = match;
    if (!fields[key]) fields[key] = [];
    fields[key].push(value.trim());
  });

  const startPage = firstValue([fields.SP?.[0], fields.C7?.[0]]);
  const endPage = fields.EP?.[0];
  return {
    title: firstValue([fields.TI?.[0], fields.T1?.[0], fields.CT?.[0]]),
    doi: firstValue([fields.DO?.[0], fields.DOI?.[0]]),
    url: fields.UR?.[0],
    page: startPage && endPage ? `${startPage}-${endPage}` : startPage,
  };
}

function parseCitationText(text) {
  const doi = extractDoi(text);
  const url = extractUrl(text);
  return {
    title: extractTitleCandidate(text),
    doi,
    url,
    page: extractPageCandidate(text),
  };
}

function extractDoi(text) {
  const match = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? normalizeDoi(match[0]) : "";
}

function extractUrl(text) {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0].replace(/[),.;]+$/, "") : "";
}

function extractPageCandidate(text) {
  const match =
    text.match(/\bpp?\.\s*([A-Za-z]?\d+(?:\s*[-–—]\s*[A-Za-z]?\d+)?)/i) ??
    text.match(/\bpages?\s+([A-Za-z]?\d+(?:\s*[-–—]\s*[A-Za-z]?\d+)?)/i);
  return match ? match[1] : "";
}

function extractTitleCandidate(text) {
  const withoutLinks = text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bdoi:\s*10\.\S+/gi, "")
    .replace(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi, "")
    .trim();
  const quoted = withoutLinks.match(/[“"]([^”"]{8,220})[”"]/);
  if (quoted) return cleanTitleCandidate(quoted[1]);

  const apa = withoutLinks.match(/\(\d{4}[a-z]?\)\.\s+(.+?)\.\s+[A-Z][^.]{2,}/);
  if (apa) return cleanTitleCandidate(apa[1]);

  const lines = withoutLinks
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const likely = lines.find(
    (line) =>
      line.length > 12 &&
      line.length < 220 &&
      !/^(TY|AU|DO|SP|EP|ER|UR|PY|JO|JF)\s+-/.test(line) &&
      !/^\w+\s*=/.test(line),
  );
  return cleanTitleCandidate(likely ?? "");
}

function cleanTitleCandidate(value) {
  return cleanFieldValue(value)
    .replace(/^\d+\.\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/[.。]+$/, "")
    .trim();
}

function cleanFieldValue(value) {
  return String(value ?? "")
    .trim()
    .replace(/^["{]+|["},]+$/g, "")
    .replace(/[{}]/g, "")
    .replace(/\\([&%_$#{}])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDoi(value) {
  if (!value) return "";
  return String(value)
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[),.;]+$/, "");
}

function normalizePage(value) {
  if (!value) return "";
  const cleaned = cleanFieldValue(value).replace(/\s*[-–—]\s*/g, "-").replace(/--/g, "-");
  if (!cleaned) return "";
  return /^p{1,2}\./i.test(cleaned) ? cleaned : `pp. ${cleaned}`;
}

function firstValue(values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) ?? "";
}

function cleanZoteroText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .trim();
}

function blankSentence(sentence, word, shouldBlank) {
  if (!shouldBlank || !word) return escapeHtml(sentence);
  const regex = new RegExp(escapeRegExp(word), "gi");
  let cursor = 0;
  let output = "";
  let found = false;

  sentence.replace(regex, (match, index) => {
    found = true;
    output += escapeHtml(sentence.slice(cursor, index));
    output += `<span class="blank" aria-label="빈칸">${blankMask(match)}</span>`;
    cursor = index + match.length;
    return match;
  });

  if (!found) return escapeHtml(sentence);
  output += escapeHtml(sentence.slice(cursor));
  return output;
}

function blankMask(match) {
  return "&nbsp;".repeat(Math.max(4, String(match).length));
}

function sourceMarkup(entry) {
  const parts = [];
  if (entry.paperTitle) parts.push(escapeHtml(entry.paperTitle));
  if (entry.page) parts.push(escapeHtml(entry.page));
  const label = parts.join(" · ") || "출처 없음";
  const link = validUrl(entry.source);
  if (!link) return `<p>${label}</p>`;
  return `<p>${label}<br><a class="source-link" href="${escapeHtml(link)}" target="_blank" rel="noreferrer">${escapeHtml(link)}</a></p>`;
}

function validUrl(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  const candidate = trimmed.startsWith("10.") ? `https://doi.org/${trimmed}` : trimmed;
  try {
    return new URL(candidate).href;
  } catch {
    return "";
  }
}

function createId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function statusLabel(status) {
  if (status === "mastered") return "완료";
  if (status === "review") return "복습";
  return "새 단어";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function starIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>`;
}

function editIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>`;
}

function trashIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>`;
}
