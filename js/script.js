const defaultStats = {
  health: 0,
  sanity: 0,
  clues: 0,
  actions: 3,
  willpower: 0,
  intellect: 0,
  combat: 0,
  agility: 0,
  ability: "",
};
const investigatorCodes = {
  "조이 사마라스": "02001",
  "로랜드 뱅크스": "01001",
  "데이지 워커": "01002",
};

async function fetchInvestigatorData(code) {
  const res = await fetch(`https://arkhamdb.com/api/public/card/${code}`, {
    headers: { "Accept-Language": "ko" },
  });
  if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);
  return res.json();
}

function createStatElement(name, label, value, idx) {
  return (
    `<div class="stat"><label>${label}</label>` +
    `<button onclick="changeStat(${idx},'${name}',-1)">-</button>` +
    `<span class="value" id="${name}-${idx}">${value}</span>` +
    `<button onclick="changeStat(${idx},'${name}',1)">+</button></div>`
  );
}

function updateInvestigatorStats(i, stats) {
  const card = document.getElementById(`investigator-${i}`);
  card.querySelector(".abilities").innerHTML =
    `<span><img src="images/willpower.png" class="ability-icon" alt="의지">${stats.willpower}</span>` +
    `<span><img src="images/intellect.png" class="ability-icon" alt="지식">${stats.intellect}</span>` +
    `<span><img src="images/combat.png" class="ability-icon" alt="힘">${stats.combat}</span>` +
    `<span><img src="images/agility.png" class="ability-icon" alt="민첩">${stats.agility}</span>`;
  ["health", "sanity", "clues", "actions"].forEach((stat) => {
    card.querySelector(`#${stat}-${i}`).textContent = stats[stat];
  });
  card.querySelector(`#ability-${i}`).textContent = stats.ability;
}

async function selectInvestigator(i) {
  const name = document.getElementById(`investigator-select-${i}`).value;
  const code = investigatorCodes[name];
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
      actions: 3,
      ability: data.text || "",
    };
    localStorage.setItem(`investigator-${i}`, JSON.stringify(stats));
    updateInvestigatorStats(i, stats);
  } catch (e) {
    alert(e.message);
  }
}

function changeStat(i, stat, delta) {
  const el = document.getElementById(`${stat}-${i}`);
  let val = parseInt(el.textContent) + delta;
  if (val < 0) val = 0;
  el.textContent = val;
  const saved = JSON.parse(localStorage.getItem(`investigator-${i}`)) || {
    ...defaultStats,
  };
  saved[stat] = val;
  localStorage.setItem(`investigator-${i}`, JSON.stringify(saved));
}

function resetStats(i) {
  selectInvestigator(i);
}

function resetAllStats() {
  const count = parseInt(document.getElementById("playerCount").value);
  for (let i = 0; i < count; i++) resetStats(i);
}

async function setupPlayers() {
  const count = parseInt(document.getElementById("playerCount").value);
  const area = document.getElementById("investigatorArea");
  area.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const saved = JSON.parse(localStorage.getItem(`investigator-${i}`)) || {
      ...defaultStats,
    };
    const html =
      `<div class="investigator" id="investigator-${i}">` +
      `<div class="left-panel">` +
      `<button class="reset-btn" onclick="resetStats(${i})">리셋</button>` +
      `<h3>조사자 ${i + 1}</h3>` +
      `<div class="investigator-select">` +
      `<label>선택:</label>` +
      `<select id="investigator-select-${i}" onchange="selectInvestig ator(${i})">` +
      `<option>조이 사마라스</option>` +
      `<option>로랜드 뱅크스</option>` +
      `<option>데이지 워커</option>` +
      `</select>` +
      `</div>` +
      `<div class="abilities">` +
      `<span><img src="images/willpower.png" class="ability-icon" alt="의지">${saved.willpower}</span>` +
      `<span><img src="images/intellect.png" class="ability-icon" alt="지식">${saved.intellect}</span>` +
      `<span><img src="images/combat.png" class="ability-icon" alt="힘">${saved.combat}</span>` +
      `<span><img src="images/agility.png" class="ability-icon" alt="민첩">${saved.agility}</span>` +
      `</div>` +
      createStatElement("health", "체력", saved.health, i) +
      createStatElement("sanity", "정신력", saved.sanity, i) +
      createStatElement("clues", "단서", saved.clues, i) +
      createStatElement("actions", "행동 수", saved.actions, i) +
      `</div>` +
      `<div class="right-panel">` +
      `<div class="ability-description" id="ability-${i}">${saved.ability}</div>` +
      `</div>` +
      `</div>`;
    area.insertAdjacentHTML("beforeend", html);
    document.getElementById(`investigator-select-${i}`).value = Object.keys(
      investigatorCodes
    ).find(
      (name) =>
        JSON.parse(localStorage.getItem(`investigator-${i}`))?.willpower ===
          saved.willpower && name
    );
  }
}

window.onload = setupPlayers;
