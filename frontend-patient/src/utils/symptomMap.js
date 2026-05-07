// ── Symptom → specialty (used by chip filter) ─────────────────────
export const symptomMap = {
  "mal de tête":          "Neurologie",
  "migraine":             "Neurologie",
  "vertiges":             "Neurologie",
  "douleur poitrine":     "Cardiologie",
  "palpitations":         "Cardiologie",
  "hypertension":         "Cardiologie",
  "essoufflement":        "Pneumologie",
  "toux persistante":     "Pneumologie",
  "mal de dos":           "Rhumatologie",
  "douleur articulaire":  "Rhumatologie",
  "douleur genou":        "Orthopédie",
  "fracture":             "Orthopédie",
  "acné":                 "Dermatologie",
  "eczéma":               "Dermatologie",
  "éruption cutanée":     "Dermatologie",
  "maux de ventre":       "Gastro-entérologie",
  "nausée":               "Gastro-entérologie",
  "diarrhée":             "Gastro-entérologie",
  "anxiété":              "Psychiatrie",
  "dépression":           "Psychiatrie",
  "insomnie":             "Psychiatrie",
  "fièvre":               "Médecine générale",
  "fatigue":              "Médecine générale",
  "diabète":              "Médecine générale",
  "grossesse":            "Gynécologie-Obstétrique",
  "règles douloureuses":  "Gynécologie-Obstétrique",
  "problème de vision":   "Ophtalmologie",
  "mal aux oreilles":     "ORL",
  "maux de gorge":        "ORL",
  "saignement nez":       "ORL",
  "problèmes dentaires":  "Dentiste",
  "mal aux dents":        "Dentiste",
  "santé enfant":         "Pédiatrie",
  "fièvre enfant":        "Pédiatrie",
};

// ── Urgency levels per symptom ────────────────────────────────────
export const urgencyMap = {
  "mal de tête":         "moyen",
  "migraine":            "moyen",
  "vertiges":            "moyen",
  "douleur poitrine":    "urgent",
  "palpitations":        "urgent",
  "hypertension":        "urgent",
  "essoufflement":       "urgent",
  "toux persistante":    "faible",
  "mal de dos":          "faible",
  "douleur articulaire": "faible",
  "douleur genou":       "faible",
  "fracture":            "urgent",
  "acné":                "faible",
  "eczéma":              "faible",
  "éruption cutanée":    "moyen",
  "maux de ventre":      "moyen",
  "nausée":              "faible",
  "diarrhée":            "moyen",
  "anxiété":             "moyen",
  "dépression":          "moyen",
  "insomnie":            "faible",
  "fièvre":              "moyen",
  "fatigue":             "faible",
  "diabète":             "moyen",
  "grossesse":           "moyen",
  "règles douloureuses": "faible",
  "problème de vision":  "moyen",
  "mal aux oreilles":    "faible",
  "maux de gorge":       "faible",
  "saignement nez":      "moyen",
  "problèmes dentaires": "faible",
  "mal aux dents":       "moyen",
  "santé enfant":        "moyen",
  "fièvre enfant":       "urgent",
};

// ── Keyword → { specialty, urgency } — used by AI text analyzer ──
const keywordRules = [
  // Neurologie
  { words: ["tête","tete","céphalée","cephalee","migraine","vertige","vertiges","convulsion","épilepsie"],  specialty: "Neurologie",            urgency: "moyen"  },
  // Cardiologie
  { words: ["cœur","coeur","cardiaque","palpitation","poitrine","tension","hypertension","infarctus"],      specialty: "Cardiologie",           urgency: "urgent" },
  // Pneumologie
  { words: ["poumons","respiration","essoufflement","toux","bronchite","asthme","pneumonie"],              specialty: "Pneumologie",           urgency: "moyen"  },
  // Gastro
  { words: ["ventre","estomac","intestin","digestion","nausée","nausee","vomissement","diarrhée","diarrhee","constipation","foie","ulcère"], specialty: "Gastro-entérologie",   urgency: "moyen"  },
  // Rhumatologie
  { words: ["dos","colonne","arthrite","articulation","rhumatisme","lombalgie"],                           specialty: "Rhumatologie",          urgency: "faible" },
  // Orthopédie
  { words: ["genou","hanche","épaule","fracture","os","entorse","ligament","cheville"],                    specialty: "Orthopédie",            urgency: "moyen"  },
  // Dermatologie
  { words: ["peau","acné","acne","eczéma","eczema","psoriasis","allergie","urticaire","éruption"],         specialty: "Dermatologie",          urgency: "faible" },
  // ORL
  { words: ["oreille","gorge","nez","sinusite","laryngite","amygdale","rhume","voix"],                     specialty: "ORL",                   urgency: "faible" },
  // Ophtalmologie
  { words: ["œil","oeil","yeux","vision","vue","myopie","glaucome","cataracte"],                           specialty: "Ophtalmologie",         urgency: "moyen"  },
  // Psychiatrie
  { words: ["anxiété","anxiete","dépression","depression","stress","insomnie","angoisse","panique","burnout","phobie"], specialty: "Psychiatrie",         urgency: "moyen"  },
  // Gynécologie
  { words: ["grossesse","enceinte","règles","regles","menstruation","utérus","ovaire","gynéco"],           specialty: "Gynécologie-Obstétrique", urgency: "moyen" },
  // Pédiatrie
  { words: ["enfant","bébé","bebe","nourrisson","pédiatrie","pediatre","pédiatre"],                        specialty: "Pédiatrie",             urgency: "moyen"  },
  // Dentiste
  { words: ["dent","dents","gencive","mâchoire","machoire","carie"],                                       specialty: "Dentiste",              urgency: "faible" },
  // Médecine générale (catch-all)
  { words: ["fièvre","fievre","fatigue","grippe","rhume","mal","douleur","diabète","diabete","tension"],   specialty: "Médecine générale",     urgency: "moyen"  },
  // Urgence override
  { words: ["urgent","urgence","grave","critique","sévère","severe","aigu"],                               specialty: "Médecine générale",     urgency: "urgent" },
];

// ── analyzeSymptoms: free-text → { specialty, urgency, matches } ──
export function analyzeSymptoms(text) {
  if (!text.trim()) return null;

  const normalize = s => s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ");

  const normalized = normalize(text);

  const URGENCY_ORDER = { urgent: 3, moyen: 2, faible: 1 };
  const specialtyCounts = {};
  let topUrgency = "faible";
  const matchedWords = new Set();

  for (const rule of keywordRules) {
    for (const word of rule.words) {
      if (normalize(normalized).includes(normalize(word))) {
        specialtyCounts[rule.specialty] = (specialtyCounts[rule.specialty] || 0) + 1;
        if (URGENCY_ORDER[rule.urgency] > URGENCY_ORDER[topUrgency]) {
          topUrgency = rule.urgency;
        }
        matchedWords.add(word);
      }
    }
  }

  if (!Object.keys(specialtyCounts).length) {
    return { specialty: "Médecine générale", urgency: "faible", matches: [] };
  }

  const topSpecialty = Object.entries(specialtyCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    specialty: topSpecialty,
    urgency:   topUrgency,
    matches:   [...matchedWords],
  };
}

export default symptomMap;
