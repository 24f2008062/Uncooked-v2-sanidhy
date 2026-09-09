/**
 * Real client device detection from navigator userAgent
 */
export function getRealClientDevice() {
  if (typeof window === "undefined" || !window.navigator) {
    return {
      id: "current-device",
      name: "Desktop Browser",
      browser: "Chrome",
      os: "Windows",
      isMobile: false,
      lastActive: "Active now",
      isCurrent: true,
    };
  }

  const ua = window.navigator.userAgent || "";
  let browser = "Chrome";
  let os = "Windows";
  let isMobile = false;

  // OS detection
  if (/iPhone/i.test(ua)) {
    os = "iOS";
    isMobile = true;
  } else if (/iPad/i.test(ua)) {
    os = "iPadOS";
    isMobile = true;
  } else if (/Android/i.test(ua)) {
    os = "Android";
    isMobile = true;
  } else if (/Win/i.test(ua)) {
    os = "Windows";
  } else if (/Mac/i.test(ua)) {
    os = "macOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  // Browser detection
  if (/Edg\//i.test(ua)) {
    browser = "Edge";
  } else if (/OPR\/|Opera/i.test(ua)) {
    browser = "Opera";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox";
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = isMobile ? "Mobile Safari" : "Safari";
  }

  return {
    id: "current-session",
    name: `${browser} on ${os}`,
    browser,
    os,
    isMobile,
    lastActive: "Active now",
    isCurrent: true,
  };
}
