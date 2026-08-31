import prisma from "@/lib/prisma";
import { jsonError, jsonOk, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";

export async function POST(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, { rateKey: "rl_opp_apply", limit: 10, windowMs: 60 * 60 * 1000 });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const coverNote = String(body.coverNote || body.note || "").trim().slice(0, 2000);
    const resumeUrl = String(body.resumeUrl || body.portfolio || "").trim().slice(0, 300);

    if (resumeUrl && !/^https:\/\//i.test(resumeUrl)) {
      return jsonError("Portfolio / resume link must be an https URL", 400);
    }

    const opportunity = await prisma.opportunity.findFirst({
      where: { id, status: "ACTIVE" },
    });
    if (!opportunity) {
      return jsonError("Opportunity not found", 404, "NOT_FOUND");
    }

    const application = await prisma.opportunityApplication.upsert({
      where: {
        opportunityId_userId: { opportunityId: id, userId: auth.user.id },
      },
      update: {
        coverNote: coverNote || null,
        resumeUrl: resumeUrl || null,
      },
      create: {
        opportunityId: id,
        userId: auth.user.id,
        coverNote: coverNote || null,
        resumeUrl: resumeUrl || null,
      },
    });

    return jsonOk({
      message: "Application submitted",
      applicationId: application.id,
      status: application.status,
    }, 201);
  } catch (error) {
    return safeError(error, "Unable to submit application");
  }
}
