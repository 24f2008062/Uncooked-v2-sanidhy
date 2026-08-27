const EVENT_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;

export function isValidEventId(id) {
  return typeof id === "string" && EVENT_ID_RE.test(id);
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

export function publicEvent(event, { registrationCount = 0 } = {}) {
  if (!event) return null;
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
    description: event.description,
    schedule: event.schedule,
    prizePool: event.prizePool,
    bannerUrl: event.bannerUrl,
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
