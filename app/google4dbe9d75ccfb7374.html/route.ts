export function GET() {
  return new Response("google-site-verification: google4dbe9d75ccfb7374.html", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
