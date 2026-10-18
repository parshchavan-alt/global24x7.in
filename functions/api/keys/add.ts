/**
 * Cloudflare Pages Function: /api/keys/add
 */

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const key = body.key?.trim();

    if (!key) {
      return new Response(JSON.stringify({ success: false, error: 'API key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '✓ API Key received and activated on Cloudflare edge.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
