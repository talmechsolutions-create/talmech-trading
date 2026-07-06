import {NextRequest, NextResponse} from 'next/server';
import {metalProfiles} from '@/lib/metalKnowledge';

type Signal = {
  metal: string;
  region: string;
  industry: string;
  demandScore: number;
  signal: string;
  searchQuery: string;
  recommendedAction: string;
  source: string;
};

function hasRealKey(value?: string) {
  if (!value) return false;
  const v = value.trim();
  return Boolean(v && !v.includes('your_') && !v.includes('paste_'));
}

function defaultSignals(region: string): Signal[] {
  const focus = metalProfiles.flatMap(metal => metal.industries.slice(0, 2).map(industry => ({metal, industry})));
  return focus.slice(0, 10).map(({metal, industry}, index) => ({
    metal: metal.name,
    region,
    industry: industry.name,
    demandScore: Math.max(62, 92 - index * 3),
    signal: `${industry.name} is a strong target segment for ${metal.name} because estimated usage share is ${industry.usagePercent}%.`,
    searchQuery: `${industry.searchKeywords[0]} ${metal.name} buyers in ${region}`,
    recommendedAction: `Find 20 companies, call purchase/owner, qualify grade + monthly quantity, then move real prospects into CRM.`,
    source: 'Knowledge-base scoring'
  }));
}

async function serpNewsSignal(query: string) {
  const key = process.env.SERPAPI_KEY;
  if (!hasRealKey(key)) return [] as any[];
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('tbm', 'nws');
  url.searchParams.set('q', query);
  url.searchParams.set('gl', 'in');
  url.searchParams.set('hl', 'en');
  url.searchParams.set('api_key', key as string);
  const response = await fetch(url.toString(), {next: {revalidate: 60 * 60 * 6}});
  if (!response.ok) return [];
  const data = await response.json();
  return (data.news_results || []).slice(0, 4);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const region = String(body.region || 'India');
    const base = defaultSignals(region);

    if (!hasRealKey(process.env.SERPAPI_KEY)) {
      return NextResponse.json({mode: 'knowledge', signals: base, message: 'SERPAPI_KEY not active, so signals are generated from metal knowledge and industry usage. Add SerpApi to enrich with live news/search.'});
    }

    const enriched = await Promise.all(base.slice(0, 6).map(async signal => {
      const news = await serpNewsSignal(`${signal.metal} demand ${signal.industry} ${region} India`);
      return {
        ...signal,
        signal: news[0]?.title ? `${signal.signal} Recent search/news indicator: ${news[0].title}` : signal.signal,
        source: news[0]?.source ? `SerpApi News + ${news[0].source}` : 'SerpApi News check'
      };
    }));

    return NextResponse.json({mode: 'live-assisted', signals: [...enriched, ...base.slice(6, 10)], message: 'Market signals refreshed. Treat these as prospecting priorities, not guaranteed market prices.'});
  } catch (error) {
    return NextResponse.json({mode: 'error', signals: [], message: 'Market signal refresh failed.'}, {status: 500});
  }
}
