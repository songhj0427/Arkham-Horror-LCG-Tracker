const defaultStats = {
  health: 0,
  sanity: 0,
  clues: 0,
  resources: 0,
  actions: 3,
  willpower: 0,
  intellect: 0,
  combat: 0,
  agility: 0,
  ability: "",
  maxHealth: 0,
  maxSanity: 0,
  maxActions: 3,
};

let investigatorCodes = {};

async function loadInvestigatorCodes() {
  try {
    const response = await fetch("/api/investigator-code");
    if (!response.ok) {
      throw new Error("네트워크 오류");
    }

    const data = await response.json(); // 응답을 받아옴

    // 예: [{ "로랜드 뱅크스 (Core)": "01001" }, ...] → 병합해서 하나의 객체로 만들기
    const investigatorCodesTemp = Object.assign({}, ...data);

    // 이제 investigatorCodesTemp 변수에 원하는 데이터가 들어 있음
    return investigatorCodesTemp;
  } catch (err) {
    console.error("조사자 코드 가져오기 실패:", err);
    return null;
  }
}

async function fetchInvestigatorData(code) {
  console.log(code);
  const res = await fetch(`/api/investigator/${code}`);
  if (!res.ok) {
    throw new Error(`서버 오류: ${res.status}`);
  }
  return res.json();
}

function updateInvestigatorStats(i, stats) {
  const card = document.getElementById(`investigator-${i}`);
  if (!stats.maxHealth) stats.maxHealth = stats.health;
  if (!stats.maxSanity) stats.maxSanity = stats.sanity;
  stats.maxActions = stats.maxActions || stats.actions;

  // header with action count
  const header = card.querySelector(".header");
  header.innerHTML = `
        <h3>조사자 ${i + 1}</h3>
        <div>
          <span class="actions-btn" 
            style="display:flex;justify-content:center;align-items:center;width:36px;height:36px;background-image:url('images/action.png');background-size:contain;background-repeat:no-repeat;" 
            onclick="changeStat(${i},'actions',1)" 
            oncontextmenu="event.preventDefault(); changeStat(${i},'actions',-1)">
            ${stats.actions}
          </span>
        </div>`;

  // abilities
  card.querySelector(".abilities").innerHTML = [
    "willpower",
    "intellect",
    "combat",
    "agility",
  ]
    .map(
      (stat) =>
        `<span onclick="changeAbility(${i},'${stat}',1)" oncontextmenu="changeAbility(${i},'${stat}',-1);return false;">` +
        `<img src="images/${stat}.png" class="ability-icon" alt="${stat}">${stats[stat]}` +
        `</span>`
    )
    .join("");

  // grid: health, sanity, clues, resources
  const grid = card.querySelector(".stat-grid");
  grid.innerHTML = ["health", "sanity", "clues", "resources"]
    .map((stat) => `<span data-stat="${stat}">${stats[stat]}</span>`)
    .join("");
  grid.querySelectorAll("span").forEach((span) => {
    const stat = span.dataset.stat;
    span.style.backgroundImage = `url('images/${stat}.png')`;
    span.onclick = () => changeStat(i, stat, 1);
    span.oncontextmenu = (e) => {
      e.preventDefault();
      changeStat(i, stat, -1);
    };
  });

  card.querySelector(`#ability-${i}`).innerHTML = stats.ability;
  localStorage.setItem(`investigator-${i}`, JSON.stringify(stats));
}

function changeAbility(i, stat, delta) {
  const saved = JSON.parse(localStorage.getItem(`investigator-${i}`)) || {
    ...defaultStats,
  };
  saved[stat] = Math.max(0, saved[stat] + delta);
  localStorage.setItem(`investigator-${i}`, JSON.stringify(saved));
  updateInvestigatorStats(i, saved);
}

function changeStat(i, stat, delta) {
  const saved = JSON.parse(localStorage.getItem(`investigator-${i}`)) || {
    ...defaultStats,
  };
  if (stat === "health")
    saved.health = Math.min(saved.maxHealth, Math.max(0, saved.health + delta));
  else if (stat === "sanity")
    saved.sanity = Math.min(saved.maxSanity, Math.max(0, saved.sanity + delta));
  else if (stat === "actions" && delta < 0)
    saved.actions =
      saved.actions === 0 ? saved.maxActions : saved.actions + delta;
  else saved[stat] = Math.max(0, saved[stat] + delta);
  updateInvestigatorStats(i, saved);
}

function getAbilityKorean(packCode, code) {}

async function selectInvestigator(i) {
  const code = document.getElementById(`investigator-select-${i}`).value;
  try {
    const data = await fetchInvestigatorData(code);
    const stats = {
      willpower: data.skill_willpower,
      intellect: data.skill_intellect,
      combat: data.skill_combat,
      agility: data.skill_agility,
      health: data.health,
      sanity: data.sanity,
      clues: 0,
      resources: 5,
      actions: 3,
      ability: data.text || "",
      maxHealth: data.health,
      maxSanity: data.sanity,
      maxActions: 3,
    };
    localStorage.setItem(`investigator-${i}`, JSON.stringify(stats));
    updateInvestigatorStats(i, stats);
  } catch (e) {
    alert(e.message);
  }
}

function resetStats(i) {
  selectInvestigator(i);
}
function resetAllStats() {
  for (
    let i = 0;
    i < parseInt(document.getElementById("playerCount").value);
    i++
  )
    resetStats(i);
}

async function setupPlayers() {
  const cnt = parseInt(document.getElementById("playerCount").value),
    area = document.getElementById("investigatorArea");
  area.innerHTML = "";
  for (let i = 0; i < cnt; i++) {
    const html =
      `<div class="investigator" id="investigator-${i}">` +
      `<div class="left-panel">` +
      `<button class="reset-btn" onclick="resetStats(${i})">리셋</button>` +
      `<div class="header"></div>` +
      `<div class="investigator-select">` +
      `<select id="investigator-select-${i}" onchange="selectInvestigator(${i})">` +
      Object.entries(investigatorCodes)
        .map(([name, code]) => `<option value="${code}">${name}</option>`)
        .join("") +
      `</select></div>` +
      `<div class="abilities"></div>` +
      `<div class="stat-grid"></div>` +
      `</div>` +
      `<div class="right-panel"><div class="ability-description" id="ability-${i}"></div></div>` +
      `</div>`;
    area.insertAdjacentHTML("beforeend", html);
    const firstInvestigatorCode = Object.values(investigatorCodes)[0];
    document.getElementById(`investigator-select-${i}`).value =
      firstInvestigatorCode;
    selectInvestigator(i);
  }
}

window.onload = async () => {
  investigatorCodes = await loadInvestigatorCodes(); // 먼저 데이터 받아오고
  console.log(investigatorCodes);
  setupPlayers(); // 그 다음에 setup 실행
};
