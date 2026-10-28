// Pages entry point for dutaglobalgroup.pages.dev.
// APP is a Cloudflare Service binding to the production Worker dutaglobalgroup.
// Forward the original request to preserve same-origin checks and session cookies.
export default {
  fetch(request, env) {
    return env.APP.fetch(request);
  }
};
