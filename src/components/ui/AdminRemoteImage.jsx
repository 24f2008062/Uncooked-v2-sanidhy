"use client";

import Image from "next/image";

const ALLOWED_HOST_SUFFIXES = [
  "images.unsplash.com",
  "ui-avatars.com",
  "supabase.co",
  "cmseducation.org",
];

function isAllowedRemote(src) {
  try {
    const host = new URL(src).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

/**
 * Prefer next/image for allowlisted hosts; fall back to <img> for arbitrary
 * admin-pasted URLs so previews never break.
 */
export default function AdminRemoteImage({
  src,
  alt = "",
  width,
  height,
  fill = false,
  className = "",
  onError,
}) {
  if (!src) return null;

  if (isAllowedRemote(src) && (fill || (width && height))) {
    return (
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={className}
        onError={onError}
        unoptimized={false}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin URL preview
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={onError}
    />
  );
}
