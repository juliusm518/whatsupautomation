import test from "node:test";
import assert from "node:assert/strict";
import {
  createGoogleCalendarBooking,
  fetchGoogleCalendarBusyWindows,
  googleCalendarConfigured,
  hydrateBusinessCalendarBusyWindows
} from "../src/integrations/googleCalendar.js";

test("detects Google Calendar OAuth configuration", () => {
  assert.equal(googleCalendarConfigured({}), false);
  assert.equal(googleCalendarConfigured({ GOOGLE_CALENDAR_ACCESS_TOKEN: "token" }), true);
  assert.equal(googleCalendarConfigured({
    GOOGLE_CALENDAR_CLIENT_ID: "client",
    GOOGLE_CALENDAR_CLIENT_SECRET: "secret",
    GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh"
  }), true);
});

test("maps Google Calendar freeBusy windows to local slot keys", async () => {
  const calls = [];
  const busyWindows = await fetchGoogleCalendarBusyWindows({
    calendarId: "primary",
    timeZone: "Asia/Singapore",
    now: new Date("2026-05-22T00:00:00.000Z"),
    env: { GOOGLE_CALENDAR_ACCESS_TOKEN: "token" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          calendars: {
            primary: {
              busy: [
                {
                  start: "2026-05-22T03:00:00Z",
                  end: "2026-05-22T04:00:00Z"
                }
              ]
            }
          }
        })
      };
    }
  });

  assert.deepEqual(busyWindows, [
    {
      start: "2026-05-22T11:00",
      end: "2026-05-22T12:00"
    }
  ]);
  assert.equal(calls[0].url, "https://www.googleapis.com/calendar/v3/freeBusy");
  assert.match(calls[0].options.headers.authorization, /Bearer token/);
});

test("hydrates a connected business calendar with live busy windows", async () => {
  const business = {
    id: "tuition-hub",
    businessHours: { timeZone: "Asia/Singapore" },
    calendar: {
      connected: true,
      calendarId: "primary",
      busyWindows: []
    }
  };

  const hydrated = await hydrateBusinessCalendarBusyWindows({
    business,
    now: new Date("2026-05-22T00:00:00.000Z"),
    env: { GOOGLE_CALENDAR_ACCESS_TOKEN: "token" },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        calendars: {
          primary: {
            busy: [
              {
                start: "2026-05-22T03:00:00Z",
                end: "2026-05-22T04:00:00Z"
              }
            ]
          }
        }
      })
    })
  });

  assert.deepEqual(hydrated.calendar.busyWindows, [
    {
      start: "2026-05-22T11:00",
      end: "2026-05-22T12:00"
    }
  ]);
});

test("creates a Google Calendar event for a confirmed booking", async () => {
  const calls = [];
  const booking = await createGoogleCalendarBooking({
    business: {
      name: "BrightPath Tuition",
      type: "Tuition Centre",
      appointmentLabel: "trial lesson",
      businessHours: { timeZone: "Asia/Singapore" },
      calendar: {
        connected: true,
        calendarId: "primary"
      }
    },
    lead: {
      name: "Julius",
      phone: "91234567",
      service: "P5 Math"
    },
    slot: {
      start: "2026-05-23T14:00",
      end: "2026-05-23T15:00",
      label: "Sat, 23 May 2:00 pm"
    },
    env: { GOOGLE_CALENDAR_ACCESS_TOKEN: "token" },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          id: "event-123",
          htmlLink: "https://calendar.google.com/event?eid=event-123"
        })
      };
    }
  });

  assert.equal(booking.created, true);
  assert.equal(booking.eventId, "event-123");
  assert.equal(calls[0].url, "https://www.googleapis.com/calendar/v3/calendars/primary/events");
  const payload = JSON.parse(calls[0].options.body);
  assert.match(payload.summary, /BrightPath Tuition/);
  assert.equal(payload.start.dateTime, "2026-05-23T14:00:00+08:00");
  assert.equal(payload.end.dateTime, "2026-05-23T15:00:00+08:00");
  assert.match(payload.description, /91234567/);
});
