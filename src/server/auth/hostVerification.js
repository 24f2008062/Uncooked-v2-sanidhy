export const VALID_ORG_TYPES = [
  "College Club",
  "University Department",
  "Student Initiative",
  "Company",
  "NGO",
  "Independent",
  "Other",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

export function validateHostApplication(data = {}) {
  const organizationName = String(data.organizationName || data.orgName || "").trim().slice(0, 120);
  const organizationType = String(data.organizationType || data.orgType || "College Club").trim();
  const applicantName = String(data.applicantName || data.fullName || "").trim().slice(0, 100);
  const applicantRole = String(data.applicantRole || data.roleInOrg || "").trim().slice(0, 100);
  const contactEmail = String(data.contactEmail || data.gmail || data.email || "").trim().toLowerCase();
  const contactPhone = String(data.contactPhone || data.phone || "").trim().slice(0, 30);
  const linkedinUrl = String(data.linkedinUrl || data.linkedin || "").trim().slice(0, 300);
  const proofDocumentUrl = String(data.proofDocumentUrl || data.documentUrl || data.proofUrl || "").trim().slice(0, 500);
  const websiteUrl = String(data.websiteUrl || data.website || "").trim().slice(0, 300);
  const instagram = String(data.instagram || "").trim().slice(0, 100);
  const twitter = String(data.twitter || "").trim().slice(0, 100);
  const hostingReason = String(data.hostingReason || data.description || data.notes || "").trim().slice(0, 2000);

  if (!organizationName || organizationName.length < 2) {
    return { valid: false, error: "Organization / Club name is required (minimum 2 characters)." };
  }
  if (!VALID_ORG_TYPES.includes(organizationType)) {
    return { valid: false, error: `Invalid organization type. Allowed types: ${VALID_ORG_TYPES.join(", ")}` };
  }
  if (!applicantName || applicantName.length < 2) {
    return { valid: false, error: "Applicant / Representative full name is required." };
  }
  if (!applicantRole || applicantRole.length < 2) {
    return { valid: false, error: "Your role in the organization is required (e.g., President, Lead Organizer)." };
  }
  if (!contactEmail || !EMAIL_REGEX.test(contactEmail)) {
    return { valid: false, error: "A valid contact email address is required." };
  }
  if (!contactPhone || !PHONE_REGEX.test(contactPhone) || contactPhone.replace(/\D/g, "").length < 8) {
    return { valid: false, error: "A valid contact phone number with country code is required (min 8 digits)." };
  }
  if (!linkedinUrl || linkedinUrl.length < 5) {
    return { valid: false, error: "A valid LinkedIn or professional profile URL is required." };
  }
  if (!hostingReason || hostingReason.length < 10) {
    return { valid: false, error: "Please describe the events you plan to host and your target audience (min 10 characters)." };
  }

  return {
    valid: true,
    data: {
      organizationName,
      organizationType,
      applicantName,
      applicantRole,
      contactEmail,
      contactPhone,
      linkedinUrl,
      proofDocumentUrl: proofDocumentUrl || null,
      websiteUrl: websiteUrl || null,
      instagram: instagram || null,
      twitter: twitter || null,
      hostingReason,
    },
  };
}

export function parseHostApplicationNotes(notes) {
  if (!notes) return null;
  try {
    return JSON.parse(notes);
  } catch {
    return { text: notes };
  }
}

