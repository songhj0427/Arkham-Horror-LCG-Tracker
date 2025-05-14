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
  "위니프레드 해버먹": "60301",
};

async function fetchInvestigatorData(code) {
  const response = await fetch(`https://arkhamdb.com/api/public/card/${code}`, {
    headers: {
      "Accept-Language": "ko",
    },
  });
  if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);
  return await response.json();
}

function createStatElement(name, label, value, idx) {
  return `<div class="stat"><label>${label}</label><button onclick="changeStat(${idx}, '${name}', -1)">-</button><span class="value" id="${name}-${idx}">${value}</span><button onclick="changeStat(${idx}, '${name}', 1)">+</button></div>`;
}

function updateInvestigatorStats(index, stats) {
  const card = document.getElementById(`investigator-${index}`);
  card.querySelector(".abilities").innerHTML = `
        <span>${stats.willpower}</span><span>${stats.intellect}</span><span>${stats.combat}</span><span>${stats.agility}</span>`;
  card.querySelector(`#health-${index}`).textContent = stats.health;
  card.querySelector(`#sanity-${index}`).textContent = stats.sanity;
  card.querySelector(`#clues-${index}`).textContent = stats.clues;
  card.querySelector(`#actions-${index}`).textContent = stats.actions;
  card.querySelector(`#ability-${index}`).textContent = stats.ability;
}

async function selectInvestigator(index) {
  const name = document.getElementById(`investigator-select-${index}`).value;
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
    localStorage.setItem(`investigator-${index}`, JSON.stringify(stats));
    updateInvestigatorStats(index, stats);
  } catch (e) {
    alert(e.message);
  }
}

function changeStat(index, stat, delta) {
  const elem = document.getElementById(`${stat}-${index}`);
  let value = parseInt(elem.textContent) + delta;
  if (value < 0) value = 0;
  elem.textContent = value;
  const saved = JSON.parse(localStorage.getItem(`investigator-${index}`)) || {
    ...defaultStats,
  };
  saved[stat] = value;
  localStorage.setItem(`investigator-${index}`, JSON.stringify(saved));
}

function resetStats(index) {
  const stats = { ...defaultStats, clues: 0, actions: 3 };
  localStorage.setItem(`investigator-${index}`, JSON.stringify(stats));
  updateInvestigatorStats(index, stats);
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
    const html = `
          <div class="investigator" id="investigator-${i}">
            <button class="reset-btn" onclick="resetStats(${i})">리셋</button>
            <h3>조사자 ${i + 1}</h3>
            <div class="investigator-select">
              <label>선택:</label>
              <select id="investigator-select-${i}" onchange="selectInvestigator(${i})">
                <option>조이 사마라스</option>
                <option>로랜드 뱅크스</option>
                <option>데이지 워커</option>
                <option>위니프레드 해버먹</option>
              </select>
            </div>
            <div class="abilities"><span>${saved.willpower}</span><span>${
      saved.intellect
    }</span><span>${saved.combat}</span><span>${saved.agility}</span></div>
            ${createStatElement("health", "체력", saved.health, i)}
            ${createStatElement("sanity", "정신력", saved.sanity, i)}
            ${createStatElement("clues", "단서", saved.clues, i)}
            ${createStatElement("actions", "행동 수", saved.actions, i)}
            <div class="ability-description" id="ability-${i}">${
      saved.ability
    }</div>
          </div>`;
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
