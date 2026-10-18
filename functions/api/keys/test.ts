/**
 * Cloudflare Pages Function: /api/keys/test
 * Verifies Gemini key via Google API from edge
 */

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const key = body.key?.trim();

    if (!key) {
      return new Response(JSON.stringify({ success: false, message: 'Please provide a key to test' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const googleRes = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with OK' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    const googleData: any = await googleRes.json().catch(() => ({}));

    if (googleRes.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '✓ Key verified successfully with Google Gemini via Cloudflare edge!',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: googleData?.error?.message || `Google API returned status ${googleRes.status}`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
