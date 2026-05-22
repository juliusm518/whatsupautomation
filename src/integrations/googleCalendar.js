const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";
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

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
