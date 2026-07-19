const UPSTREAM_ORIGIN = "https://online-assessment-system.app0.workers.dev";

export async function onRequest(context) {
  const { request, params } = context;
  const path = Array.isArray(params.path)
    ? params.path.join("/")
    : String(params.path || "");
  const targetUrl = new URL(`${UPSTREAM_ORIGIN}/api/${path}${new URL(request.url).search}`);

  const headers = new Headers(request.headers);
  headers.set("host", new URL(UPSTREAM_ORIGIN).host);
  headers.set("x-forwarded-host", new URL(request.url).host);
  headers.set("x-forwarded-proto", new URL(request.url).protocol.replace(":", ""));

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: shouldProxyBody(request.method) ? request.body : undefined,
    redirect: "manual"
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("access-control-allow-origin");
  responseHeaders.delete("access-control-allow-credentials");
  responseHeaders.delete("access-control-allow-headers");
  responseHeaders.delete("access-control-allow-methods");
  responseHeaders.delete("report-to");
  responseHeaders.delete("nel");
  responseHeaders.delete("cf-ray");
  responseHeaders.delete("server");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders
  });
}

function shouldProxyBody(method) {
  return !["GET", "HEAD"].includes(String(method || "").toUpperCase());
}
