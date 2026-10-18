/**
 * Cloudflare Pages Function: /api/scheduler
 */

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      config: {
        enabled: true,
        frequencyMinutes: 60,
        naturalJitter: true,
        topicStrategy: 'balanced',
        categoriesInRotation: ['Technology', 'Business', 'World', 'Science', 'Health', 'Culture'],
        autoPublish: true,
        languageMode: 'both',
        articlesGeneratedCount: 0,
      },
      countdownSeconds: 3600,
      isRunningCycle: false,
      logs: [],
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export async function onRequestPost(context: any) {
  const body = await context.request.json().catch(() => ({}));
  return new Response(
    JSON.stringify({
      success: true,
      config: body,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
