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
      appointmentLabel: "trial lesson",
      calendar: defaultCalendar({
        calendarId: "primary",
        connected: true
      })
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
      appointmentLabel: "service slot",
      calendar: defaultCalendar()
    },
    {
      id: "plumbing-care",
      name: "PipeWise Plumbing",
      type: "Plumbing",
      whatsappNumber: "+65 8777 2030",
      owner: "Mei Wong",
      autoReplyEnabled: true,
      escalationEnabled: true,
      businessHours: {
        timeZone: DEFAULT_TIME_ZONE,
        days: [1, 2, 3, 4, 5, 6],
        open: "08:00",
        close: "20:00"
      },
      faqs: [
        {
          question: "Do you handle urgent leaks?",
          answer: "Yes, we handle urgent leaks when a plumber is available. Please share your block, unit type, and a photo if possible."
        },
        {
          question: "How much is plumbing repair?",
          answer: "Inspection starts from $40, and repair pricing depends on the issue after the plumber checks it."
        },
        {
          question: "Which plumbing services do you provide?",
          answer: "We handle leaking pipes, clogged sinks, toilet flush issues, tap replacement, and water heater connections."
        }
      ],
      appointmentLabel: "repair visit",
      calendar: defaultCalendar()
    },
    {
      id: "reno-studio",
      name: "HomeCraft Renovation",
      type: "Renovation",
      whatsappNumber: "+65 8555 4412",
      owner: "Darren Koh",
      autoReplyEnabled: true,
      escalationEnabled: true,
      businessHours: {
        timeZone: DEFAULT_TIME_ZONE,
        days: [1, 2, 3, 4, 5, 6],
        open: "10:00",
        close: "18:30"
      },
      faqs: [
        {
          question: "Do you provide renovation quotes?",
          answer: "Yes, we can prepare a quote after reviewing your floor plan, scope, preferred style, and timeline."
        },
        {
          question: "Can you handle HDB renovations?",
          answer: "Yes, we handle HDB, condo, and landed renovation work, including carpentry, flooring, and kitchen upgrades."
        },
        {
          question: "How long does renovation take?",
          answer: "Small upgrades can take 2 to 4 weeks, while full-home projects usually need 8 to 12 weeks after approvals."
        }
      ],
      appointmentLabel: "renovation consultation",
      calendar: defaultCalendar()
    },
    {
      id: "hawker-kitchen",
      name: "Uncle Lim Chicken Rice",
      type: "Hawker Stall",
      whatsappNumber: "+65 8666 5108",
      owner: "Lim Ah Seng",
      autoReplyEnabled: true,
      escalationEnabled: true,
      businessHours: {
        timeZone: DEFAULT_TIME_ZONE,
        days: [1, 2, 3, 4, 5, 6],
        open: "10:30",
        close: "15:00"
      },
      faqs: [
        {
          question: "Can I place a bulk order?",
          answer: "Yes, bulk orders are available with at least one day's notice. Please share the number of packets and pickup time."
        },
        {
          question: "What dishes do you sell?",
          answer: "We sell steamed chicken rice, roasted chicken rice, char siew rice, and soup add-ons while stocks last."
        },
        {
          question: "Where is your stall?",
          answer: "We are at Bedok Food Centre, stall 18, usually open for lunch from Monday to Saturday."
        }
      ],
      appointmentLabel: "bulk order pickup",
      calendar: defaultCalendar()
    },
    {
      id: "bakery-bites",
      name: "SweetCrumb Bakery",
      type: "Bakery",
      whatsappNumber: "+65 8444 7788",
      owner: "Nur Aisyah",
      autoReplyEnabled: true,
      escalationEnabled: true,
      businessHours: {
        timeZone: DEFAULT_TIME_ZONE,
        days: [2, 3, 4, 5, 6, 0],
        open: "09:00",
        close: "17:30"
      },
      faqs: [
        {
          question: "Do you make custom cakes?",
          answer: "Yes, we make custom birthday and celebration cakes with 3 to 5 days' notice depending on design."
        },
        {
          question: "How much are cakes?",
          answer: "Standard 6-inch cakes start from $48. Custom cakes are quoted based on size, flavor, and decoration."
        },
        {
          question: "Do you deliver?",
          answer: "Delivery is available islandwide from $12, or customers can self-collect from our Tampines bakery."
        }
      ],
      appointmentLabel: "cake order",
      calendar: defaultCalendar()
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
      },
      {
        id: "conv-1003",
        businessId: "plumbing-care",
        customerName: "Mr Ong",
        customerPhone: "+65 9888 2044",
        status: "needs-human",
        intent: "escalation",
        summary: "Customer reported an urgent pipe leak and needs a repair visit today.",
        lead: {
          name: "Mr Ong",
          phone: "+65 9888 2044",
          service: "Urgent leaking pipe repair",
          preferredTime: "Today"
        },
        messages: [
          {
            from: "customer",
            text: "Urgent, my kitchen pipe is leaking. Can someone come today?",
            timestamp: "2026-05-16T03:05:00.000Z"
          },
          {
            from: "assistant",
            text: "I have flagged this for a plumber. Please share your block, unit type, and whether the water supply can be turned off.",
            timestamp: "2026-05-16T03:05:03.000Z"
          }
        ]
      },
      {
        id: "conv-1004",
        businessId: "reno-studio",
        customerName: "Rachel",
        customerPhone: "+65 9333 7788",
        status: "qualified-lead",
        intent: "lead",
        summary: "Customer asked for a kitchen renovation quote and wants a consultation next week.",
        lead: {
          name: "Rachel",
          phone: "+65 9333 7788",
          service: "Kitchen renovation quote",
          preferredTime: "Next week"
        },
        messages: [
          {
            from: "customer",
            text: "Hi, can I get a quote for kitchen renovation? I can do consultation next week.",
            timestamp: "2026-05-16T04:20:00.000Z"
          },
          {
            from: "assistant",
            text: "Yes, we can help with a kitchen renovation quote. Please share your floor plan, target budget, timeline, and preferred consultation slot.",
            timestamp: "2026-05-16T04:20:02.000Z"
          }
        ]
      },
      {
        id: "conv-1005",
        businessId: "hawker-kitchen",
        customerName: "Anita",
        customerPhone: "+65 9222 6611",
        status: "qualified-lead",
        intent: "appointment",
        summary: "Customer wants a bulk chicken rice order for pickup tomorrow.",
        lead: {
          name: "Anita",
          phone: "+65 9222 6611",
          service: "Chicken rice bulk order",
          preferredTime: "Tomorrow"
        },
        messages: [
          {
            from: "customer",
            text: "Can I order 25 packets of chicken rice for pickup tomorrow at 12pm?",
            timestamp: "2026-05-16T05:12:00.000Z"
          },
          {
            from: "assistant",
            text: "Yes, we can help with a bulk order pickup. Please share your name, contact number, pickup time, and whether you prefer steamed or roasted chicken.",
            timestamp: "2026-05-16T05:12:02.000Z"
          }
        ]
      },
      {
        id: "conv-1006",
        businessId: "bakery-bites",
        customerName: "Siti",
        customerPhone: "+65 9444 8833",
        status: "qualified-lead",
        intent: "appointment",
        summary: "Customer asked about a custom birthday cake order for the weekend.",
        lead: {
          name: "Siti",
          phone: "+65 9444 8833",
          service: "Custom birthday cake",
          preferredTime: "Weekend"
        },
        messages: [
          {
            from: "customer",
            text: "Hi, can I book a custom birthday cake for this weekend?",
            timestamp: "2026-05-16T06:30:00.000Z"
          },
          {
            from: "assistant",
            text: "Yes, we can help with a cake order. Please share the date, size, flavor, design idea, and whether you need delivery or self-collection.",
            timestamp: "2026-05-16T06:30:02.000Z"
          }
        ]
      }
    ]
  };
}

export function createStarterConversation(business, now = new Date()) {
  const profile = `${business?.name || ""} ${business?.type || ""}`;
  const starterMessages = [
    [/aircon/i, "Hi, how much is servicing and do you have a slot tomorrow?"],
    [/plumbing/i, "Urgent, my sink pipe is leaking. Can someone come today?"],
    [/renovation/i, "Hi, can you quote for kitchen renovation and schedule a consultation next week?"],
    [/hawker|chicken rice/i, "Can I order 20 packets of chicken rice for pickup tomorrow?"],
    [/bakery|cake/i, "Hi, how much is a custom cake and can I book one for this weekend?"]
  ];
  const matchedStarter = starterMessages.find(([pattern]) => pattern.test(profile));
  const text = matchedStarter
    ? matchedStarter[1]
    : "Hi, where are you located and how much are classes?";

  return handleIncomingMessage({
    business,
    now,
    message: {
      id: `conv-${crypto.randomUUID()}`,
      from: "+65 9000 1122",
      text,
      timestamp: now.toISOString()
    }
  }).conversation;
}

export function defaultCalendar(overrides = {}) {
  return {
    provider: "google",
    calendarId: "",
    connected: false,
    bookingDurationMinutes: 60,
    bufferMinutes: 15,
    busyWindows: [],
    ...overrides
  };
}

export function calendarForBusiness(business = {}) {
  const calendar = business.calendar || {};
  return defaultCalendar({
    ...calendar,
    calendarId: String(calendar.calendarId || "").trim(),
    connected: Boolean(calendar.connected && calendar.calendarId),
    bookingDurationMinutes: positiveInteger(calendar.bookingDurationMinutes, 60),
    bufferMinutes: positiveInteger(calendar.bufferMinutes, 15),
    busyWindows: Array.isArray(calendar.busyWindows) ? calendar.busyWindows : []
  });
}

export function buildAvailabilityPreview(business, options = {}) {
  const calendar = calendarForBusiness(business);
  const hours = business?.businessHours || {};
  const now = options.now || new Date();
  const slotLimit = positiveInteger(options.slotLimit, 8);
  const duration = calendar.bookingDurationMinutes;
  const slots = [];

  for (let dayOffset = 0; dayOffset < 14 && slots.length < slotLimit; dayOffset += 1) {
    const date = addDays(now, dayOffset);
    const local = localDateParts(date, hours.timeZone || DEFAULT_TIME_ZONE);
    if (!(hours.days || []).includes(local.weekday)) {
      continue;
    }

    const dateKey = `${local.year}-${pad(local.month)}-${pad(local.day)}`;
    for (let minutes = toMinutes(hours.open); minutes + duration <= toMinutes(hours.close) && slots.length < slotLimit; minutes += duration + calendar.bufferMinutes) {
      const start = `${dateKey}T${minutesToTime(minutes)}`;
      const end = `${dateKey}T${minutesToTime(minutes + duration)}`;
      if (!isBusy(start, end, calendar.busyWindows)) {
        slots.push({
          date: dateKey,
          start: minutesToTime(minutes),
          end: minutesToTime(minutes + duration),
          label: `${formatSlotDate(dateKey)} ${formatDisplayTime(minutes)}`
        });
      }
    }
  }

  return {
    calendar,
    connected: calendar.connected,
    openSlots: slots,
    bookedCount: calendar.busyWindows.length
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
    "toilet",
    "pipe",
    "sink",
    "plumbing",
    "renovation",
    "carpentry",
    "tiles",
    "kitchen",
    "chicken rice",
    "nasi lemak",
    "bento",
    "buffet",
    "cake",
    "cupcake",
    "pastry",
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

function minutesToTime(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function localDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-SG", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  const weekdayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

  return {
    year: parts.find((part) => part.type === "year").value,
    month: parts.find((part) => part.type === "month").value,
    day: parts.find((part) => part.type === "day").value,
    weekday: weekdayMap[parts.find((part) => part.type === "weekday").value]
  };
}

function isBusy(start, end, busyWindows = []) {
  return busyWindows.some((window) => start < window.end && end > window.start);
}

function formatSlotDate(dateKey) {
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(`${dateKey}T00:00:00+08:00`));
}

function formatDisplayTime(minutes) {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(`2026-01-01T${minutesToTime(minutes)}:00+08:00`));
}
