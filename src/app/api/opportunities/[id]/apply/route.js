import prisma from "@/lib/prisma";
import { jsonError, jsonOk, readJson, safeError } from "@/server/http/envelope";
import { enforceMutationGuards, requireUser } from "@/server/http/guards";

function isSchemaMissingError(error) {
  const code = String(error?.code || "");
  const msg = String(error?.message || "");
  return (
    code === "P2021" ||
    code === "P2010" ||
    /OpportunityApplication/i.test(msg) ||
    /does not exist/i.test(msg) ||
    /relation .* does not exist/i.test(msg)
  );
}

export async function POST(req, { params }) {
  try {
    const blocked = await enforceMutationGuards(req, {
      rateKey: "rl_opp_apply",
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (blocked) return blocked;

    const auth = await requireUser();
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!id || typeof id !== "string" || id.length > 80) {
      return jsonError("Opportunity not found", 404, "NOT_FOUND");
    }

    const parsed = await readJson(req);
    if (parsed.error) return parsed.error;
    const body = parsed.body || {};

    const coverNote = String(body.coverNote || body.note || "").trim().slice(0, 2000);
    const resumeUrl = String(body.resumeUrl || body.portfolio || "").trim().slice(0, 300);

    if (!coverNote && !resumeUrl) {
      return jsonError(
        "Add a short cover note or an https portfolio / resume link to apply.",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (resumeUrl && !/^https:\/\//i.test(resumeUrl)) {
      return jsonError("Portfolio / resume link must be an https URL", 400, "VALIDATION_ERROR");
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

    return jsonOk(
      {
        message: "Application submitted",
        applicationId: application.id,
        status: application.status,
      },
      201
    );
  } catch (error) {
    if (isSchemaMissingError(error)) {
      console.error("[OPP_APPLY] schema/table unavailable:", error?.code || error?.message);
      return jsonError(
        "Applications are temporarily unavailable. Please try again later.",
        503,
        "DEPENDENCY_UNAVAILABLE"
      );
    }
    return safeError(error, "Unable to submit application");
  }
}
