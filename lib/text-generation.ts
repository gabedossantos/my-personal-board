// Provider-agnostic, local text/JSON generator used for development and tests.
// This avoids external calls and any vendor/provider references in the public codebase.

export type Message = { role: 'user' | 'system'; content: string };

export interface GenerateOptions {
  messages: Message[];
  mode?: 'text' | 'json';
  maxTokens?: number;
  temperature?: number;
}

// Simple heuristics to produce plausible responses deterministically.
export async function generateLocal(options: GenerateOptions): Promise<{ content: string; provider?: 'local' }> {
  const { messages, mode = 'text' } = options;
  const last = messages[messages.length - 1]?.content || '';

  if (mode === 'json') {
    // Produce a basic JSON structure expected by callers
    const json = {
      overallAssessment: 'Promising direction with open questions around validation and execution.',
      keyRisks: [
        'Assumptions behind demand are untested',
        'Financial model lacks sensitivity scenarios',
        'Operational scalability plan is early'
      ],
      keyOpportunities: [
        'Clear target customer pain to solve',
        'Potential to differentiate messaging',
        'Incremental rollout can de-risk ops'
      ],
      recommendations: [
        'Run 5-10 customer interviews this week',
        'Draft a simple 12-month financial plan',
        'List top 3 operational risks and mitigations',
        'Define a 60-day milestone plan'
      ],
      conversationHighlights: [
        'Board stressed validation, financial clarity, and operational readiness'
      ]
    };
  return { content: JSON.stringify(json), provider: 'local' };
  }

  // Text mode: parse prompt templates to avoid echoing instructions
  const parsed = parsePrompt(last);
  const persona = parsed.persona || 'cfo';
  const msg = (parsed.userMessage || '').trim();
  const hasPDF = parsed.strategy.hasPDF;
  const hasDetails = parsed.strategy.hasAny;
  const project = parsed.strategy.projectName;

  const leadIn = (text: string) => text.trim();

  // Tailored templates per persona
  if (persona === 'cfo') {
    if (parsed.mode === 'intro') {
      const a = hasPDF ? 'I noticed your document—helpful context.' : hasDetails ? 'Thanks for the overview.' : 'Thanks for starting the discussion.';
      const b = project ? `For ${project}, ` : '';
      const c = 'what does the unit economics look like (price, gross margin, payback)?';
  return { content: leadIn(`${a} ${b}${c}`), provider: 'local' };
    }
    // Follow-up or direct question handling
    if (/file|attached|upload/i.test(msg) && hasPDF) {
      return { content: 'Yes—I noted the uploaded document for reference. What key assumptions from it should we treat as non‑negotiable in the initial plan?', provider: 'local' };
    }
    if (/other info|rest|other details/i.test(msg)) {
      return { content: 'Helpful context. To firm this up, what revenue model are you assuming in the first 6–12 months and how sensitive is it to acquisition cost?', provider: 'local' };
    }
    return { content: leadIn('Got it. From a financial angle, what’s your target payback period on acquisition and how will you measure it in the first 60 days?'), provider: 'local' };
  }

  if (persona === 'cmo') {
    if (parsed.mode === 'intro') {
      const who = parsed.strategy.targetCustomer ? `for ${parsed.strategy.targetCustomer}` : 'for your first segment';
      return { content: leadIn(`From a growth view, who exactly is the first 1–2 buyer personas ${who}, and what signal will prove they’re ready to buy?`), provider: 'local' };
    }
    if (/what.*think|marketing|audience|brand/i.test(msg)) {
      return { content: 'Marketing take: define one sharp value proposition and a single channel to test. What’s your clearest “why now” for that audience?', provider: 'local' };
    }
    return { content: leadIn('To reach early customers, pick one channel and one message to test this week. Which channel gives you fastest learning?'), provider: 'local' };
  }

  // COO
  if (parsed.mode === 'intro') {
    return { content: leadIn('Operationally, what’s the smallest shippable scope you can deliver in 4–6 weeks, and which dependency is most likely to slip?'), provider: 'local' };
  }
  if (/scale|operations|deliver|process|team/i.test(msg)) {
    return { content: 'To scale reliably, define a simple runbook for onboarding and one quality metric. Which step is riskiest in your current process?', provider: 'local' };
  }
  return { content: leadIn('Let’s make execution concrete: what’s the next milestone and who owns it by date?'), provider: 'local' };
}

export async function generateLocalJSON(options: GenerateOptions): Promise<any> {
  const res = await generateLocal({ ...options, mode: 'json' });
  try {
    return JSON.parse(res.content);
  } catch {
    return null;
  }
}

// Naive helpers
function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function summarizeText(text: string, maxSentences = 3): string {
  const sentences = splitSentences(text);
  return sentences.slice(0, maxSentences).join(' ')
    || 'Provide more context so we can produce a helpful summary.';
}

// Parse our in-house prompt templates into a friendly structure
function parsePrompt(text: string): {
  persona: 'cfo' | 'cmo' | 'coo' | null,
  mode: 'intro' | 'continue' | 'direct',
  userMessage: string,
  strategy: {
    hasAny: boolean,
    hasPDF: boolean,
    projectName?: string,
    targetCustomer?: string,
    keyProblem?: string
  }
} {
  const lower = text.toLowerCase();
  // Prefer explicit tags when available
  let personaTag = /RESPONDING_PERSONA:\s*(cfo|cmo|coo)/i.exec(text)?.[1]?.toLowerCase() as 'cfo'|'cmo'|'coo'|undefined;
  let persona: 'cfo' | 'cmo' | 'coo' | null = personaTag || null;
  if (!persona) {
    if (/(chief financial officer|orion|cfo)/i.test(text)) persona = 'cfo';
    else if (/(chief marketing officer|pavo|cmo)/i.test(text)) persona = 'cmo';
    else if (/(chief operating officer|castor|coo)/i.test(text)) persona = 'coo';
  }

  let mode: 'intro' | 'continue' | 'direct' = /MODE:\s*(intro|continue|direct)/i.exec(text)?.[1]?.toLowerCase() as any || 'continue';
  if (mode === 'continue' && /starting a casual|greeting/i.test(lower)) mode = 'intro';
  if (mode === 'continue' && /their direct message to you/i.test(lower)) mode = 'direct';

  // Extract user’s last message
  let userMessage = '';
  const directMatch = /THEIR DIRECT MESSAGE TO YOU:\n([\s\S]*)$/i.exec(text);
  const latestMatch = /THEIR LATEST MESSAGE:\n([\s\S]*?)\n\nINSTRUCTIONS:/i.exec(text) || /THEIR LATEST MESSAGE:\n([\s\S]*)$/i.exec(text);
  const lines = text.split('\n');
  let historyLatest = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const l: string = lines[i];
    if (/^User:\s*/.test(l)) { historyLatest = l; break; }
  }
  userMessage = (directMatch?.[1] || latestMatch?.[1] || historyLatest.replace(/^User:\s*/, '') || '').trim();

  // Extract strategy hints
  const getField = (label: string) => {
    const r = new RegExp(`^${label}:\\s*(.*)$`, 'mi');
    return r.exec(text)?.[1]?.trim();
  };
  const projectName = getField('PROJECT') || getField('Project');
  const targetCustomer = getField('TARGET CUSTOMER') || getField('Target Customer');
  const keyProblem = getField('KEY PROBLEM') || getField('Key Problem');
  const hasPDF = /SUPPLEMENTARY MATERIALS: PDF document/i.test(text);
  const hasAny = !!(projectName || targetCustomer || keyProblem || hasPDF);

  return { persona, mode, userMessage, strategy: { hasAny, hasPDF, projectName, targetCustomer, keyProblem } };
}

// Provider-aware generator: uses OpenAI if OPENAI_API_KEY is set, else falls back to generateLocal
export async function generateText(options: GenerateOptions): Promise<{ content: string; provider: 'openai' | 'local' }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const local = await generateLocal({ ...options, mode: 'text' });
    if (process.env.NODE_ENV !== 'production') {
      const last = options.messages?.[options.messages.length - 1]?.content || '';
      console.info('[gen]', 'provider=local', 'reason=no_api_key', 'mode=text', 'prompt_len=', last.length);
    }
    return { content: local.content, provider: 'local' };
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const messages = options.messages.map(m => ({ role: m.role, content: m.content }));
  const body: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 400
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('OpenAI error:', res.status, res.statusText, (txt || '').slice(0, 300));
    const local = await generateLocal({ ...options, mode: 'text' });
    if (process.env.NODE_ENV !== 'production') {
      const last = options.messages?.[options.messages.length - 1]?.content || '';
      console.info('[gen]', 'provider=local', 'reason=openai_error', 'mode=text', 'prompt_len=', last.length);
    }
    return { content: local.content, provider: 'local' };
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (!content) {
    const local = await generateLocal({ ...options, mode: 'text' });
    return { content: local.content, provider: 'local' };
  }
  if (process.env.NODE_ENV !== 'production') {
    const total = (data && data.usage && data.usage.total_tokens) || undefined;
    console.info('[gen]', 'provider=openai', 'model=', model, 'total_tokens=', total ?? 'n/a');
  }
  return { content: content.trim(), provider: 'openai' };
}

export async function generateJSON(options: GenerateOptions): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return generateLocalJSON(options);

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const messages = options.messages.map(m => ({ role: m.role, content: m.content }));
  const body: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 1200,
    response_format: { type: 'json_object' }
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('OpenAI JSON error:', res.status, res.statusText, txt);
    return generateLocalJSON(options);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(content); } catch { return generateLocalJSON(options); }
}
