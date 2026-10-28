/** Canonical URL of a page: origin and path, without query string or hash. */
export function canonicalUrl(url: URL): string {
  return `${url.origin}${url.pathname}`;
}
