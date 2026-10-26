import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/api", "/login/2fa", "/verify-email", "/reset-password", "/account-setup", "/accept-invitation"] }],
  };
}
