import prisma from "@/lib/prisma";

function formatDateToICS(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICS(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(req) {
  try {
    const events = await prisma.event.findMany({
      where: {
        archived: false,
        status: "PUBLISHED",
      },
      take: 50,
      orderBy: { startsAt: "asc" },
    });

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Opportia//Campus Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Opportia Campus Events",
      "X-WR-TIMEZONE:UTC",
    ];

    for (const ev of events) {
      const start = ev.startsAt ? formatDateToICS(ev.startsAt) : formatDateToICS(new Date());
      const end = ev.endsAt
        ? formatDateToICS(ev.endsAt)
        : formatDateToICS(new Date(new Date(start).getTime() + 2 * 60 * 60 * 1000));
      const now = formatDateToICS(new Date());

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:${ev.id}@opportia.in`,
        `DTSTAMP:${now}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeICS(ev.title)}`,
        `DESCRIPTION:${escapeICS(ev.description || "Opportia Campus Event")}`,
        `LOCATION:${escapeICS(ev.venueName || "Main Campus")}`,
        `STATUS:CONFIRMED`,
        "END:VEVENT"
      );
    }

    icsContent.push("END:VCALENDAR");

    return new Response(icsContent.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="opportia-events.ics"',
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[ICAL_FEED_ERROR]", error);
    return new Response("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Opportia//EN\r\nEND:VCALENDAR", {
      status: 200,
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  }
}
