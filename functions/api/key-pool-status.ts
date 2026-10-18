/**
 * Cloudflare Pages Function: /api/key-pool-status
 * Responds cleanly on Cloudflare edge runtime
 */

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      telemetry: {
        totalKeysConfigured: 1,
        activeKeyIndex: 0,
        totalRotations: 0,
        accounts: [
          {
            index: 0,
            label: 'Cloudflare Edge Account',
            maskedKey: 'Edge-Client',
            status: 'active',
            requestsHandled: 0,
          },
        ],
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
