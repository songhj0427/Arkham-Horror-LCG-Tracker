const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

// public 폴더 안의 정적 파일 서빙
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/investigator-code", async (req, res) => {
  try {
    const response = await axios.get("https://arkhamdb.com/api/public/cards");

    const investigators = response.data.filter(
      (card) => card.type_code === "investigator"
    );

    const result = investigators.map((investigator) => ({
      [`${investigator.name} (${investigator.pack_name})`]: investigator.code,
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API 요청 실패" });
  }
});

app.get("/api/investigator/:code", async (req, res) => {
  try {
    const code = req.params.code;
    console.log(code);
    const response = await axios.get(
      `https://arkhamdb.com/api/public/card/${code}`
    );

    const card = response.data;

    const investigatorData = {
      skill_willpower: card.skill_willpower,
      skill_intellect: card.skill_intellect,
      skill_combat: card.skill_combat,
      skill_agility: card.skill_agility,
      health: card.health,
      sanity: card.sanity,
      text: card.text,
      name: card.name,
    };

    res.json(investigatorData);
  } catch (error) {
    console.error("API 요청 실패:", error);
    res.status(500).json({ error: "조사자 정보를 가져오는 데 실패했습니다." });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
