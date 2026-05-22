const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";
const GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars";
const DEFAULT_TIME_ZONE = "Asia/Singapore";

let cachedAccessToken = "";
let cachedAccessTokenExpiresAt = 0;

export function googleCalendarConfigured(env = process.env) {
  return Boolean(
    env.GOOGLE_CALENDAR_ACCESS_TOKEN ||
    (env.GOOGLE_CALENDAR_CLIENT_ID && env.GOOGLE_CALENDAR_CLIENT_SECRET && env.GOOGLE_CALENDAR_REFRESH_TOKEN)
  );
}

export async function hydrateBusinessCalendarBusyWindows({
  business,
  now = new Date(),
  env = process.env,
  fetchImpl = fetch
}) {
  const calendar = business?.calendar || {};
  if (!calendar.connected || !calendar.calendarId || !googleCalendarConfigured(env)) {
    return business;
  }

  try {
    const busyWindows = await fetchGoogleCalendarBusyWindows({
      calendarId: calendar.calendarId,
      timeZone: business.businessHours?.timeZone || DEFAULT_TIME_ZONE,
      now,
      env,
      fetchImpl
    });

    return {
      ...business,
      calendar: {
        ...calendar,
        busyWindows
      }
    };
  } catch (error) {
    console.warn(`Google Calendar availability skipped: ${error.message}`);
    return business;
  }
}

export async function fetchGoogleCalendarBusyWindows({
  calendarId,
  timeZone = DEFAULT_TIME_ZONE,
  now = new Date(),
  env = process.env,
  fetchImpl = fetch
}) {
  const accessToken = await googleCalendarAccessToken({ env, fetchImpl });
  const timeMin = now.toISOString();
  const timeMax = addDays(now, 14).toISOString();
  const response = await fetchImpl(GOOGLE_FREEBUSY_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone,
      items: [{ id: calendarId }]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `freeBusy failed with ${response.status}`);
  }

  return (payload.calendars?.[calendarId]?.busy || []).map((window) => ({
    start: toLocalSlotKey(window.start, timeZone),
    end: toLocalSlotKey(window.end, timeZone)
  }));
}

export async function createGoogleCalendarBooking({
  business,
  lead,
  slot,
  env = process.env,
  fetchImpl = fetch
}) {
  const calendar = business?.calendar || {};
  if (!calendar.connected || !calendar.calendarId || !googleCalendarConfigured(env)) {
    return { created: false, skipped: true, reason: "Google Calendar is not configured" };
  }

  const timeZone = business.businessHours?.timeZone || DEFAULT_TIME_ZONE;
  const accessToken = await googleCalendarAccessToken({ env, fetchImpl });
  const response = await fetchImpl(`${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(calendar.calendarId)}/events`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      summary: `${business.name}: ${business.appointmentLabel || "Booking"} with ${lead.name}`,
      description: [
        `Customer: ${lead.name}`,
        `Phone: ${lead.phone}`,
        `Service: ${lead.service || business.type || "Not specified"}`,
        "Created by ReplyPilot from a WhatsApp booking request."
      ].join("\n"),
      start: {
        dateTime: toRfc3339Local(slot.start, timeZone),
        timeZone
      },
      end: {
        dateTime: toRfc3339Local(slot.end, timeZone),
        timeZone
      },
      transparency: "opaque"
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `calendar event creation failed with ${response.status}`);
  }

  return {
    created: true,
    eventId: payload.id,
    htmlLink: payload.htmlLink,
    slot
  };
}

async function googleCalendarAccessToken({ env, fetchImpl }) {
  if (env.GOOGLE_CALENDAR_ACCESS_TOKEN) {
    return env.GOOGLE_CALENDAR_ACCESS_TOKEN;
  }

  if (cachedAccessToken && cachedAccessTokenExpiresAt > Date.now() + 60000) {
    return cachedAccessToken;
  }

  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
      refresh_token: env.GOOGLE_CALENDAR_REFRESH_TOKEN,
      grant_type: "refresh_token"
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "could not refresh Google Calendar access token");
  }

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = Date.now() + (Number(payload.expires_in || 3600) * 1000);
  return cachedAccessToken;
}

function toLocalSlotKey(value, timeZone) {
  const parts = new Intl.DateTimeFormat("en-SG", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(value));

  return [
    parts.find((part) => part.type === "year").value,
    parts.find((part) => part.type === "month").value,
    parts.find((part) => part.type === "day").value
  ].join("-") + `T${parts.find((part) => part.type === "hour").value}:${parts.find((part) => part.type === "minute").value}`;
}

function toRfc3339Local(value, timeZone) {
  const offset = timeZone === DEFAULT_TIME_ZONE ? "+08:00" : "";
  return `${String(value || "").slice(0, 16)}:00${offset}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
