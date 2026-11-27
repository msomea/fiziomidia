
/*
 * FizioMidia Emergency Symptom Classifier
 *
 * Purpose:
 * - Detect possible emergency symptoms before calling the main AI model.
 * - Supports English and Kiswahili, including common conversational phrases.
 * - Zero API cost: deterministic regex/keyword matching.
 *
 * IMPORTANT:
 * - This is a safety screening layer, NOT a diagnostic tool.
 * - A match means the user needs urgent human medical assessment.
 * - Do not use a non-match to conclude that a user is safe.
 * - Review and expand these patterns with qualified clinicians.
 */

const RULES = [
  // --------------------------------------------------
  // 1. STROKE / SUDDEN NEUROLOGICAL SYMPTOMS
  // --------------------------------------------------
  {
    id: "stroke",
    patterns: [
      /\bstroke\b/i,
      /\bbrain attack\b/i,
      /facial droop/i,
      /face (is )?drooping/i,
      /one side of (my |the )?face/i,
      /arm weakness/i,
      /leg weakness/i,
      /one[- ]sided weakness/i,
      /weakness on (one|my|the left|the right) side/i,
      /numbness on one side/i,
      /slurred speech/i,
      /trouble speaking/i,
      /difficulty speaking/i,
      /cannot speak properly/i,
      /difficulty understanding speech/i,
      /sudden confusion/i,
      /sudden loss of vision/i,
      /sudden blurred vision/i,
      /sudden double vision/i,
      /sudden loss of balance/i,
      /sudden trouble walking/i,
      /sudden severe headache/i,

      /uso (umepinda|umepooza|umeshuka|umeinama|umepotoka)/i,
      /mdomo (umepinda|umeshuka|umeinama|umepotoka)/i,
      /upande mmoja wa uso/i,
      /upande mmoja wa mwili/i,
      /mkono (umekufa ganzi|umepooza|umekufa nguvu|umekuwa dhaifu)/i,
      /mguu (umekufa ganzi|umepooza|umekufa nguvu|umekuwa dhaifu)/i,
      /mkono na mguu (wa kushoto|wa kulia)/i,
      /upande mmoja wa mwili hauna nguvu/i,
      /ganzi upande mmoja/i,
      /kushindwa kuongea/i,
      /kushindwa kuzungumza/i,
      /maneno hayatoki vizuri/i,
      /anaongea kwa shida/i,
      /haelewi ninachosema/i,
      /kushindwa kuelewa maneno/i,
      /kuona ghafla kwa shida/i,
      /kupoteza uwezo wa kuona ghafla/i,
      /kuona vitu viwili ghafla/i,
      /kushindwa kutembea ghafla/i,
      /kupoteza usawa ghafla/i,
      /kizunguzungu kikali cha ghafla/i,
      /maumivu makali ya kichwa ya ghafla/i,
    ],
  },

  // --------------------------------------------------
  // 2. CHEST PAIN / POSSIBLE HEART ATTACK
  // --------------------------------------------------
  {
    id: "chest-pain",
    patterns: [
      /chest pain/i,
      /pain in (my |the )?chest/i,
      /chest pressure/i,
      /chest tightness/i,
      /crushing chest/i,
      /squeezing chest/i,
      /heart attack/i,
      /pain spreading to (my |the )?(arm|jaw|back|neck)/i,
      /chest pain.*(sweating|vomiting|breathless)/i,
      /cold sweat.*chest/i,

      /maumivu ya kifua/i,
      /kifua kinauma/i,
      /kifua kinabana/i,
      /kifua kinabana sana/i,
      /kifua kinakamata/i,
      /shambulio la moyo/i,
      /maumivu ya kifua.*mkono/i,
      /maumivu ya kifua.*mgongo/i,
      /maumivu ya kifua.*taya/i,
      /jasho baridi.*kifua/i,
      /kifua kinauma na kupumua kwa shida/i,
    ],
  },

  // --------------------------------------------------
  // 3. SEVERE BREATHING DIFFICULTY / CHOKING
  // --------------------------------------------------
  {
    id: "breathing",
    patterns: [
      /can'?t breathe/i,
      /cannot breathe/i,
      /difficulty breathing/i,
      /trouble breathing/i,
      /shortness of breath/i,
      /severe breathlessness/i,
      /gasping for air/i,
      /choking/i,
      /unable to speak.*breath/i,
      /cannot speak.*breath/i,
      /blue lips/i,
      /blue fingernails/i,
      /not breathing normally/i,
      /stopped breathing/i,
      /noisy breathing/i,

      /kushindwa kupumua/i,
      /kupumua kwa shida/i,
      /anashindwa kupumua/i,
      /napumua kwa shida/i,
      /napungukiwa na hewa/i,
      /hewa haitoshi/i,
      /anakosa hewa/i,
      /anahangaika kupumua/i,
      /anapumua kwa shida sana/i,
      /anashindwa kuongea kwa sababu ya kupumua/i,
      /midomo imekuwa ya bluu/i,
      /midomo imebadilika rangi na kuwa bluu/i,
      /amebanwa koo na hawezi kupumua/i,
      /amekwama na kitu kooni/i,
    ],
  },

  // --------------------------------------------------
  // 4. SEVERE TRAUMA / HEAD / NECK / SPINAL INJURY
  // --------------------------------------------------
  {
    id: "severe-trauma",
    patterns: [
      /severe (injury|trauma|accident)/i,
      /major road accident/i,
      /serious car accident/i,
      /serious fall/i,
      /uncontrolled bleeding/i,
      /severe bleeding/i,
      /compound fracture/i,
      /open fracture/i,
      /broken bone.*visible/i,
      /bone sticking out/i,
      /head injury/i,
      /serious head injury/i,
      /neck injury/i,
      /spinal injury/i,
      /back injury.*accident/i,
      /paralysis after (a |an )?(fall|accident|injury)/i,
      /cannot move.*after (a |an )?(fall|accident)/i,

      /ajali kubwa/i,
      /ajali ya barabarani/i,
      /ameanguka kutoka juu/i,
      /ameumia kichwa/i,
      /jeraha kubwa la kichwa/i,
      /ameumia shingo/i,
      /ameumia uti wa mgongo/i,
      /ameumia mgongo baada ya ajali/i,
      /jeraha kubwa/i,
      /mfupa umejitokeza nje/i,
      /mfupa unaonekana nje ya ngozi/i,
      /mfupa umevunjika na kutoka nje/i,
      /hawezi kusogeza miguu baada ya ajali/i,
      /hawezi kusogeza mikono baada ya ajali/i,
    ],
  },

  // --------------------------------------------------
  // 5. SEVERE BLEEDING
  // --------------------------------------------------
  {
    id: "severe-bleeding",
    patterns: [
      /bleeding (won'?t|will not) stop/i,
      /uncontrolled bleeding/i,
      /heavy bleeding/i,
      /bleeding heavily/i,
      /spurting blood/i,
      /vomiting blood/i,
      /coughing up blood/i,
      /blood in vomit/i,
      /large amount of blood/i,

      /damu nyingi/i,
      /anavuja damu nyingi/i,
      /damu haitoki kwa kusimama/i,
      /damu haikomi kutoka/i,
      /damu inatoka kwa wingi/i,
      /jeraha linavuja damu sana/i,
      /anatapika damu/i,
      /anakohoa damu/i,
      /damu kwenye matapishi/i,
      /anatoa damu nyingi/i,
    ],
  },

  // --------------------------------------------------
  // 6. SEVERE ALLERGIC REACTION / ANAPHYLAXIS
  // --------------------------------------------------
  {
    id: "anaphylaxis",
    patterns: [
      /anaphylaxis/i,
      /severe allergic reaction/i,
      /throat (is )?(closing|swelling)/i,
      /swelling of (the )?(throat|tongue|face)/i,
      /tongue swelling/i,
      /face swelling.*breath/i,
      /allergic reaction.*breathing/i,
      /hives.*difficulty breathing/i,

      /mzio mkubwa/i,
      /amepata mzio.*kupumua/i,
      /koo limevimba/i,
      /koo limefunga/i,
      /ulimi umevimba/i,
      /uso umevimba.*kupumua/i,
      /mwili umevimba.*kupumua/i,
      /amevimba ghafla na anashindwa kupumua/i,
    ],
  },

  // --------------------------------------------------
  // 7. UNCONSCIOUSNESS / COLLAPSE
  // --------------------------------------------------
  {
    id: "loss-of-consciousness",
    patterns: [
      /unconscious/i,
      /passed out/i,
      /fainted/i,
      /fainting/i,
      /loss of consciousness/i,
      /not responding/i,
      /unresponsive/i,
      /cannot wake (him|her|them|me) up/i,
      /collapsed and.*not responding/i,

      /amepoteza fahamu/i,
      /amezimia/i,
      /ameanguka na hajitambui/i,
      /hajitambui/i,
      /haitikii akiitwa/i,
      /haitikii akiguswa/i,
      /haamki/i,
      /hawezi kuamshwa/i,
      /amezimia na haamki/i,
      /amepoteza fahamu kabisa/i,
    ],
  },

  // --------------------------------------------------
  // 8. SEIZURES / CONVULSIONS
  // --------------------------------------------------
  {
    id: "seizure",
    patterns: [
      /having a seizure/i,
      /active seizure/i,
      /convulsion/i,
      /convulsing/i,
      /fitting/i,
      /repeated seizures/i,
      /seizure.*not waking/i,
      /first[- ]time seizure/i,
      /seizure.*five minutes/i,

      /ana degedege/i,
      /amepata degedege/i,
      /anatetemeka na hajitambui/i,
      /anatetemeka bila kujitambua/i,
      /degedege haikomi/i,
      /degedege inarudia/i,
      /amepata kifafa.*haamki/i,
      /mtoto ana degedege/i,
      /degedege kwa mara ya kwanza/i,
    ],
  },

  // --------------------------------------------------
  // 9. POISONING / OVERDOSE
  // --------------------------------------------------
  {
    id: "poisoning",
    patterns: [
      /poisoning/i,
      /poisoned/i,
      /overdose/i,
      /took too many (pills|tablets|medications)/i,
      /swallowed poison/i,
      /drank poison/i,
      /chemical ingestion/i,
      /swallowed a toxic substance/i,

      /amekunywa sumu/i,
      /nimemeza sumu/i,
      /amemeza sumu/i,
      /amekula sumu/i,
      /sumu mwilini/i,
      /amekunywa dawa nyingi/i,
      /amezidisha dozi ya dawa/i,
      /amekunywa dawa kupita kiasi/i,
      /mtoto amekunywa dawa/i,
      /mtoto amemeza kemikali/i,
    ],
  },

  // --------------------------------------------------
  // 10. SEVERE ABDOMINAL PAIN
  // --------------------------------------------------
  {
    id: "severe-abdominal-pain",
    patterns: [
      /severe abdominal pain/i,
      /severe stomach pain/i,
      /sudden severe stomach pain/i,
      /severe abdominal swelling.*pain/i,
      /stomach pain.*fainting/i,
      /abdominal pain.*vomiting blood/i,

      /maumivu makali ya tumbo/i,
      /tumbo linauma sana/i,
      /maumivu makali ya ghafla ya tumbo/i,
      /tumbo linauma sana ghafla/i,
      /tumbo limevimba na linauma sana/i,
      /maumivu ya tumbo.*kuzimia/i,
    ],
  },

  // --------------------------------------------------
  // 11. PREGNANCY-RELATED EMERGENCIES
  // --------------------------------------------------
  {
    id: "pregnancy-emergency",
    patterns: [
      /pregnant.*heavy bleeding/i,
      /pregnancy.*severe abdominal pain/i,
      /pregnant.*seizure/i,
      /pregnant.*severe headache/i,
      /pregnant.*blurred vision/i,
      /pregnant.*fainting/i,
      /pregnant.*difficulty breathing/i,
      /pregnant.*severe chest pain/i,
      /pregnant.*reduced fetal movement/i,

      /mjamzito.*anavuja damu nyingi/i,
      /mjamzito.*damu nyingi/i,
      /mjamzito.*maumivu makali ya tumbo/i,
      /mjamzito.*degedege/i,
      /mjamzito.*maumivu makali ya kichwa/i,
      /mjamzito.*kuona kwa shida/i,
      /mjamzito.*amezimia/i,
      /mjamzito.*anashindwa kupumua/i,
      /mjamzito.*mtoto hachezi/i,
      /mimba.*damu inatoka nyingi/i,
    ],
  },

  // --------------------------------------------------
  // 12. POSSIBLE SPINAL CORD / CAUDA EQUINA EMERGENCY
  // --------------------------------------------------
  {
    id: "spinal-cord-emergency",
    patterns: [
      /new loss of bladder control/i,
      /new loss of bowel control/i,
      /cannot control (my )?(urine|bowels)/i,
      /cannot pass urine/i,
      /urinary retention.*back pain/i,
      /saddle numbness/i,
      /numbness around (my )?(groin|genitals|anus)/i,
      /back pain.*both legs.*weakness/i,
      /cauda equina/i,
      /sudden leg paralysis/i,

      /nimeshindwa kuzuia mkojo ghafla/i,
      /nimeshindwa kuzuia haja kubwa ghafla/i,
      /ameshindwa kuzuia mkojo/i,
      /ameshindwa kuzuia haja kubwa/i,
      /mkojo unatoka bila kujizuia/i,
      /haja kubwa inatoka bila kujizuia/i,
      /ganzi sehemu za siri/i,
      /ganzi sehemu ya haja kubwa/i,
      /ganzi katikati ya mapaja/i,
      /mgongo unauma na miguu yote miwili imelegea/i,
      /hawezi kukojoa na mgongo unauma/i,
      /miguu imepooza ghafla/i,
    ],
  },

  // --------------------------------------------------
  // 13. POSSIBLE BLOOD CLOT / PULMONARY EMBOLISM
  // --------------------------------------------------
  {
    id: "possible-blood-clot",
    patterns: [
      /sudden shortness of breath.*leg pain/i,
      /sudden breathlessness.*leg swelling/i,
      /chest pain.*one leg swollen/i,
      /coughing blood.*leg swelling/i,
      /possible pulmonary embolism/i,
      /pulmonary embolism/i,

      /kupumua kwa shida ghafla.*mguu/i,
      /mguu mmoja umevimba.*kupumua/i,
      /mguu mmoja unauma.*kupumua kwa shida/i,
      /maumivu ya kifua.*mguu mmoja umevimba/i,
    ],
  },

  // --------------------------------------------------
  // 14. POSSIBLE SEVERE INFECTION / MENINGITIS
  // --------------------------------------------------
  {
    id: "severe-infection",
    patterns: [
      /stiff neck.*fever/i,
      /fever.*stiff neck/i,
      /severe headache.*stiff neck/i,
      /confusion.*high fever/i,
      /purple rash.*fever/i,
      /rash.*does not fade.*pressure/i,
      /very difficult to wake.*fever/i,

      /shingo imekakamaa.*homa/i,
      /homa.*shingo imekakamaa/i,
      /maumivu makali ya kichwa.*shingo/i,
      /homa kali.*hajitambui/i,
      /upele wa zambarau.*homa/i,
      /upele usiopotea ukibonyezwa/i,
      /mtoto ana homa kali na haamki/i,
    ],
  },

  // --------------------------------------------------
  // 15. SUICIDAL THOUGHTS / IMMEDIATE SELF-HARM RISK
  // --------------------------------------------------
  {
    id: "suicidal-ideation",
    patterns: [
      /\bsuicid(e|al|ality)\b/i,
      /kill myself/i,
      /end my life/i,
      /want to die/i,
      /going to hurt myself/i,
      /self[- ]?harm/i,
      /overdose.*to die/i,
      /plan to kill myself/i,

      /kujiua/i,
      /nataka kufa/i,
      /nataka kujiua/i,
      /nimepanga kujiua/i,
      /nitajiua/i,
      /kujidhuru/i,
      /nataka kujiumiza/i,
      /nimechoka kuishi/i,
      /sioni sababu ya kuendelea kuishi/i,
      /nataka kumaliza maisha yangu/i,
    ],
  },
];

// --------------------------------------------------
// HARD-CODED ESCALATION MESSAGES
// Never generated by the LLM.
// --------------------------------------------------

const ESCALATION_MESSAGES = {
  en:
    "Your message mentions symptoms that could indicate a medical emergency. Please seek urgent medical assessment now. Call 115 for ambulance services in Tanzania, or 112 for emergency assistance. If an ambulance is unavailable, arrange safe transport to the nearest hospital emergency department. Do not wait for an online response or physiotherapy appointment. This chatbot cannot assess or manage medical emergencies.",

  sw:
    "Ujumbe wako umetaja dalili ambazo zinaweza kuashiria dharura ya kiafya. Tafadhali tafuta huduma ya matibabu ya dharura sasa hivi. Tanzania, piga 115 kwa huduma ya gari la wagonjwa au 112 kwa huduma za dharura. Ikiwa gari la wagonjwa halipatikani, tafuta usafiri salama kwenda hospitali iliyo karibu yenye huduma za dharura. Usisubiri majibu ya mtandaoni au miadi ya tiba ya fiziotherapia. Chatbot hii haiwezi kutathmini au kutibu dharura za kiafya.",
};

/**
 * Classify a user message for possible emergency signs.
 *
 * @param {string} text
 * @returns {{
 *   emergency: boolean,
 *   ruleId: string|null,
 *   matched: string|null
 * }}
 */
export const classifyEmergency = (text) => {
  if (!text || typeof text !== "string") {
    return {
      emergency: false,
      ruleId: null,
      matched: null,
    };
  }

  const normalizedText = text
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const match = normalizedText.match(pattern);

      if (match) {
        return {
          emergency: true,
          ruleId: rule.id,
          matched: match[0],
        };
      }
    }
  }

  return {
    emergency: false,
    ruleId: null,
    matched: null,
  };
};

/**
 * Get the hard-coded escalation message in the conversation language.
 *
 * @param {"en"|"sw"} language
 * @returns {string}
 */
export const getEscalationMessage = (language = "sw") => {
  return ESCALATION_MESSAGES[language] || ESCALATION_MESSAGES.sw;
};
