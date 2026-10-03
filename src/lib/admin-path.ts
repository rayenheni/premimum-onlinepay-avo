/**
 * Every template installation has one administration area. Keeping this URL
 * stable makes deployment, bookmarks and reverse-proxy rules predictable.
 */
export async function getAdminSlug() {
  return "admin";
}

export async function adminHref(path = "") {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `/admin${suffix}`;
}
