const DEFAULT_TIME_ZONE = "Asia/Singapore";

export function createDemoWorkspace() {
  const businesses = [
    {
      id: "tuition-hub",
      name: "BrightPath Tuition",
      type: "Tuition Centre",
      whatsappNumber: "+65 8123 4567",
      owner: "Alicia Tan",
      autoReplyEnabled: true,
      escalationEnabled: true,
      businessHours: {
        timeZone: DEFAULT_TIME_ZONE,
        days: [1, 2, 3, 4, 5, 6],
        open: "09:00",
        close: "19:00"
      },
      faqs: [
        {
          question: "What subjects do you teach?",
          answer: "We cover Primary English, Math, Science, and lower-secondary Math."
        },
        {
          question: "How much are classes?",
          answer: "Group classes start from $180/month. Trial lessons are available this week."
        },
        {
          question: "Where are you located?",
          answer: "We are at Tampines Central, a 5-minute walk from the MRT."
        }
      ],
      appointmentLabel: "trial lesson"
    },
    {
      id: "aircon-pro",
      name: "CoolFix Aircon",
      type: "Aircon Servicing",
      whatsappNumber: "+65 8899 1020",
      owner: "Ravi Menon",
      autoReplyEnabled: true,
      escalationEnabled: true,
      businessHours: {
        timeZone: DEFAULT_TIME_ZONE,
        days: [1, 2, 3, 4, 5, 6],
        open: "08:30",
        close: "18:00"
      },
      faqs: [
        {
          question: "How much is aircon servicing?",
          answer: "General servicing starts from $35/unit, with discounts for 3 or more units."
        },
        {
          question: "Do you handle urgent repairs?",
          answer: "Yes, urgent repair slots are available depending on technician location."
        },
        {
          question: "Which areas do you cover?",
          answer: "We cover all HDB and condo estates islandwide in Singapore."
        }
      ],
      appointmentLabel: "service slot"
    }
  ];

  return {
    businesses,
    conversations: [
      {
        id: "conv-1001",
        businessId: "tuition-hub",
        customerName: "Mrs Lim",
        customerPhone: "+65 9123 7788",
        status: "qualified-lead",
        intent: "appointment",
        summary: "Parent asked about Primary 5 Math and wants a Saturday trial lesson.",
        lead: {
          name: "Mrs Lim",
          phone: "+65 9123 7788",
          service: "Primary 5 Math",
          preferredTime: "Saturday morning"
        },
        messages: [
          {
            from: "customer",
            text: "Hi, do you have P5 Math trial class this Saturday?",
            timestamp: "2026-05-16T02:42:00.000Z"
          },
          {
            from: "assistant",
            text: "Yes, we can help with a Primary 5 Math trial lesson. May I have your child's level, preferred timing, and your name so our admin can confirm the slot?",
            timestamp: "2026-05-16T02:42:02.000Z"
          }
        ]
      },
      {
        id: "conv-1002",
        businessId: "aircon-pro",
        customerName: "Daniel",
        customerPhone: "+65 9777 6611",
        status: "needs-human",
        intent: "escalation",
        summary: "Customer has leaking aircon and asked for urgent repair today.",
        lead: {
          name: "Daniel",
          phone: "+65 9777 6611",
          service: "Urgent leaking aircon repair",
          preferredTime: "Today"
        },
        messages: [
          {
            from: "customer",
            text: "My bedroom aircon is leaking badly. Can someone come today?",
            timestamp: "2026-05-16T00:12:00.000Z"
          },
          {
            from: "assistant",
            text: "I have marked this as urgent and alerted the team. Please share your block, unit type, and whether water is dripping continuously.",
            timestamp: "2026-05-16T00:12:03.000Z"
          }
        ]
      }
    ]
  };
}

export function findBusiness(businesses, businessId) {
  return businesses.find((business) => business.id === businessId);
}

export function handleIncomingMessage({ business, message, now = new Date() }) {
  if (!business) {
    throw new Error("Business is required");
  }

  if (!message?.text?.trim()) {
    throw new Error("Message text is required");
  }

  const cleanText = message.text.trim();
  const intent = detectIntent(cleanText, business);
  const lead = extractLead(cleanText, message.from, business);
  const matchedFaq = matchFaq(cleanText, business.faqs);
  const withinHours = isWithinBusinessHours(now, business.businessHours);
  const needsHuman = shouldEscalate(cleanText, intent, business);
  const replyText = composeReply({
    business,
    intent,
    matchedFaq,
    lead,
    withinHours,
    needsHuman
  });
  const timestamp = message.timestamp || now.toISOString();

  return {
    intent,
    matchedFaq,
    lead,
    needsHuman,
    withinHours,
    reply: {
      text: replyText,
      channel: business.autoReplyEnabled ? "whatsapp-auto-reply" : "draft-only"
    },
    conversation: {
      id: message.id || `conv-${Date.now()}`,
      businessId: business.id,
      customerName: lead.name || "New WhatsApp lead",
      customerPhone: lead.phone || message.from || "Unknown",
      status: needsHuman ? "needs-human" : lead.service || lead.preferredTime ? "qualified-lead" : "auto-replied",
      intent,
      summary: summarizeConversation(cleanText, intent, lead),
      lead,
      messages: [
        {
          from: "customer",
          text: cleanText,
          timestamp
        },
        {
          from: "assistant",
          text: replyText,
          timestamp: now.toISOString()
        }
      ]
    }
  };
}

export function detectIntent(text, business = {}) {
  const normalized = normalizeText(text);
  const appointmentWords = ["book", "booking", "appointment", "slot", "available", "schedule", "trial", "come", "today", "tomorrow"];
  const escalationWords = ["urgent", "complaint", "angry", "refund", "cancel", "emergency", "leaking", "broken", "human", "call me"];
  const leadWords = ["price", "quote", "how much", "cost", "need", "interested", "can you", "do you"];
  const faqWords = (business.faqs || []).flatMap((faq) => tokenize(`${faq.question} ${faq.answer}`));

  if (escalationWords.some((word) => normalized.includes(word))) {
    return "escalation";
  }

  if (appointmentWords.some((word) => normalized.includes(word))) {
    return "appointment";
  }

  if (leadWords.some((word) => normalized.includes(word))) {
    return "lead";
  }

  if (faqWords.some((word) => word.length > 4 && normalized.includes(word))) {
    return "faq";
  }

  return "general";
}

export function matchFaq(text, faqs = []) {
  const incomingTokens = new Set(tokenize(text));
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const faqTokens = tokenize(`${faq.question} ${faq.answer}`);
    const score = faqTokens.reduce((total, token) => total + (incomingTokens.has(token) ? 1 : 0), 0) / Math.max(faqTokens.length, 1);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore >= 0.18 ? { ...bestMatch, confidence: Number(bestScore.toFixed(2)) } : null;
}

export function extractLead(text, fallbackPhone = "", business = {}) {
  const phoneMatch = text.match(/(?:\+?65[\s-]?)?[689]\d{3}[\s-]?\d{4}/);
  const nameMatch = text.match(/\b(?:i am|i'm|name is|this is)\s+([a-z][a-z\s]{1,32})/i);
  const preferredTimeMatch = text.match(/\b(today|tomorrow|tonight|morning|afternoon|evening|weekend|sat(?:urday)?|sun(?:day)?|\d{1,2}\s?(?:am|pm))\b/i);
  const service = inferService(text, business);

  return {
    name: nameMatch ? titleCase(nameMatch[1].trim()) : "",
    phone: phoneMatch ? phoneMatch[0].replace(/\s|-/g, "") : fallbackPhone || "",
    service,
    preferredTime: preferredTimeMatch ? titleCase(preferredTimeMatch[0]) : ""
  };
}

export function isWithinBusinessHours(date, businessHours) {
  if (!businessHours) {
    return true;
  }

  const local = new Intl.DateTimeFormat("en-SG", {
    timeZone: businessHours.timeZone || DEFAULT_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const weekdayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  const weekday = weekdayMap[local.find((part) => part.type === "weekday").value];
  const hour = local.find((part) => part.type === "hour").value;
  const minute = local.find((part) => part.type === "minute").value;
  const currentMinutes = toMinutes(`${hour}:${minute}`);

  return (
    businessHours.days.includes(weekday) &&
    currentMinutes >= toMinutes(businessHours.open) &&
    currentMinutes <= toMinutes(businessHours.close)
  );
}

export function shouldEscalate(text, intent, business = {}) {
  if (!business.escalationEnabled) {
    return false;
  }

  const normalized = normalizeText(text);
  const escalationWords = ["urgent", "emergency", "complaint", "refund", "angry", "lawsuit", "call me", "human", "leaking badly"];
  return intent === "escalation" || escalationWords.some((word) => normalized.includes(word));
}

function composeReply({ business, intent, matchedFaq, lead, withinHours, needsHuman }) {
  const prefix = withinHours
    ? `Hi, thanks for contacting ${business.name}.`
    : `Hi, thanks for contacting ${business.name}. We are currently outside business hours, but I can still help collect the details.`;

  if (needsHuman) {
    return `${prefix} I have flagged this for a human operator. Please share your name, contact number, and the key details so the team can respond quickly.`;
  }

  if (intent === "appointment") {
    return `${prefix} I can help request a ${business.appointmentLabel || "booking"}. Please share your name, phone number, preferred date/time, and what you need help with.`;
  }

  if (matchedFaq) {
    return `${prefix} ${matchedFaq.answer} Would you like me to collect your details for follow-up?`;
  }

  if (intent === "lead" || lead.service) {
    return `${prefix} I can help with that. Please share your name, phone number, preferred timing, and any important details so we can follow up with the right answer.`;
  }

  return `${prefix} Could you share a little more detail, such as what service you need and your preferred timing?`;
}

function summarizeConversation(text, intent, lead) {
  const service = lead.service ? ` for ${lead.service}` : "";
  const preferredTime = lead.preferredTime ? `, preferred ${lead.preferredTime}` : "";
  return `${titleCase(intent)} inquiry${service}${preferredTime}: "${text.slice(0, 120)}"`;
}

function inferService(text, business) {
  const normalized = normalizeText(text);
  const serviceHints = [
    "math",
    "english",
    "science",
    "trial",
    "aircon",
    "servicing",
    "repair",
    "leaking",
    "plumbing",
    "renovation",
    "cake",
    "order"
  ];
  const found = serviceHints.filter((hint) => normalized.includes(hint));

  if (found.length) {
    return titleCase(found.slice(0, 3).join(" "));
  }

  if (business.type) {
    return business.type;
  }

  return "";
}

function tokenize(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["the", "and", "you", "are", "for", "with", "can", "how"].includes(token));
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
