const EVENT_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;

export function isValidEventId(id) {
  return typeof id === "string" && EVENT_ID_RE.test(id);
}

/** Only http(s) banners belong in JSON APIs — data: URLs explode list payload size. */
export function publicBannerUrl(url, { allowData = false } = {}) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.slice(0, 2048);
  if (allowData && /^data:image\//i.test(trimmed)) return trimmed;
  return null;
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).slice(0, 40)).filter(Boolean).slice(0, 20);
  } catch {
    return [];
  }
}

function basePublicEvent(event, { registrationCount = 0, allowDataBanner = false } = {}) {
  const capacity = Number(event.capacity) || 0;
  const taken = Number(registrationCount) || 0;
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    category: event.category,
    tags: parseJsonArray(event.tags),
    date: event.date,
    location: event.location,
    zone: event.zone,
    city: event.city,
    state: event.state,
    country: event.country,
    bannerUrl: publicBannerUrl(event.bannerUrl, { allowData: allowDataBanner }),
    ticketType: event.ticketType,
    price: event.ticketType === "Paid" ? event.price : 0,
    capacity,
    waitlistEnabled: Boolean(event.waitlistEnabled),
    status: event.status,
    hostName: event.createdBy?.fullName || event.createdBy?.name || null,
    registrationCount: taken,
    spotsLeft: Math.max(0, capacity - taken),
  };
}

/** Full public event (detail pages). Data banners allowed here only. */
export function publicEvent(event, { registrationCount = 0 } = {}) {
  if (!event) return null;
  return {
    ...basePublicEvent(event, { registrationCount, allowDataBanner: true }),
    description: event.description,
    schedule: event.schedule,
    prizePool: event.prizePool,
  };
}

/**
 * Slim list card DTO — omits long text + data: banners (were ~200KB+/event).
 * Detail remains on GET /api/events/[id].
 */
export function publicEventListItem(event, { registrationCount = 0 } = {}) {
  if (!event) return null;
  const base = basePublicEvent(event, { registrationCount, allowDataBanner: false });
  const raw = String(event.description || "");
  const blurb = raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;
  return {
    ...base,
    blurb,
  };
}
