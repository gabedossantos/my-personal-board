import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const result: any = {
    hasApiKey: hasKey,
    model,
    provider: hasKey ? 'openai' : 'local',
    ok: false,
  };

  if (!hasKey) {
    result.message = 'No OPENAI_API_KEY configured; falling back to local generator.';
    result.ok = true; // endpoint works, but provider is local
    return NextResponse.json(result);
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a health check. Reply with OK.' },
          { role: 'user', content: 'Say OK.' }
        ],
        max_tokens: 5,
        temperature: 0
      })
    });
    const text = await res.text();
    if (!res.ok) {
      result.ok = false;
      result.error = `HTTP ${res.status} ${res.statusText}`;
      result.responseSample = text.slice(0, 300);
      return NextResponse.json(result, { status: 500 });
    }
    const data = JSON.parse(text);
    result.ok = true;
    result.usage = data?.usage;
    result.sample = data?.choices?.[0]?.message?.content?.slice(0, 40) || '';
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err), provider: 'openai' }, { status: 500 });
  }
}
