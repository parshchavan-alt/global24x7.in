/**
 * Cloudflare Pages Function: /api/scheduler/run-now
 */

export async function onRequestPost() {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Triggered from Cloudflare edge.',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
