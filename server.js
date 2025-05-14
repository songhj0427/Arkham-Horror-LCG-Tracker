const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = 3000;

// public 폴더 안의 정적 파일 서빙
app.use(express.static(path.join(__dirname, "public")));

async function findPackJsonPath(packCode) {
  const packRootDir = path.join(__dirname, "pack");

  try {
    const subdirs = await fs.readdir(packRootDir);
    for (const dir of subdirs) {
      const possiblePath = path.join(packRootDir, dir, `${packCode}.json`);
      try {
        await fs.access(possiblePath);
        return possiblePath;
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.error("pack 폴더 탐색 중 오류 : ", err);
  }

  return null;
}

app.get("/api/investigator-code", async (req, res) => {
  try {
    const response = await axios.get("https://arkhamdb.com/api/public/cards");

    const investigators = response.data.filter(
      (card) => card.type_code === "investigator"
    );

    const result = [];

    for (const investigator of investigators) {
      let koreanName = investigator.name;

      const packJsonPath = await findPackJsonPath(investigator.pack_code);
      if (packJsonPath) {
        try {
          const jsonData = await fs.readFile(packJsonPath, "utf-8");
          const data = JSON.parse(jsonData);
          const matched = data.find((item) => item.code === investigator.code);
          if (matched && matched.name) {
            koreanName = matched.name;
          }
        } catch (err) {
          console.error(`JSON 읽기 오류 (${packJsonPath}):`, err);
        }
      }
      result.push({
        [`${koreanName} (${investigator.pack_name})`]: investigator.code,
      });
    }
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

    const jsonPath = await findPackJsonPath(card.pack_code);

    let investigatorDataJson = null;
    if (jsonPath) {
      const jsonText = await fs.readFile(jsonPath, "utf-8");
      investigatorDataJson = JSON.parse(jsonText);
    }

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

    if (Array.isArray(investigatorDataJson)) {
      const matched = investigatorDataJson.find(
        (item) => item.code === card.code
      );

      if (matched) {
        investigatorData.name = matched.name || investigatorData.name;
        investigatorData.text = matched.text || investigatorData.text;
      }
    }

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
