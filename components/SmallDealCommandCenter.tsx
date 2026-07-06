'use client';

import {useMemo,useState} from 'react';
import {metalProducts} from '@/lib/metalProducts';
import {indiaLocations,getCitiesForState} from '@/lib/indiaLocations';

type Plan={
  title:string; summary:string; metal:string; product:string; region:string; budget:number; maxExposure:number; targetMargin:string; dealFlow:string[]; searchActions:string[]; buyerQuestions:string[]; supplierQuestions:string[]; logisticsChecks:string[]; riskControls:string[]; todayActions:string[]; marketingAngles:string[];
};

const services=['Metal brokerage','Scrap sourcing','Supplier discovery','Buyer demand matching','Logistics coordination','Small quantity trading','Fabrication material sourcing'];
const dealModels=[
  {name:'No-inventory brokerage',risk:'Lowest',note:'Take demand first, verify supplier second, earn commission/spread without buying stock.'},
  {name:'Token-based confirmed deal',risk:'Low',note:'Buyer gives token/PO, supplier confirms stock, Talmech coordinates quote and logistics.'},
  {name:'Scrap aggregation lead',risk:'Medium',note:'Collect small scrap supplier leads and connect to verified recyclers/foundries.'},
  {name:'Sample/urgent supply coordination',risk:'Medium',note:'Coordinate urgent small material requirement where speed creates margin.'}
];

const money=(n:number)=>`₹${Math.round(n).toLocaleString('en-IN')}`;
const clean=(v:string)=>v.replace(/[^a-zA-Z0-9 ,.&/()-]/g,'').trim();

function fallbackPlan(input:{budget:number;metal:string;product:string;city:string;state:string;dealModel:string;service:string}):Plan{
  const maxExposure=Math.min(input.budget*0.25,2500);
  const region=`${input.city}, ${input.state}`;
  const product=input.product||'small quantity metal requirement';
  const metal=input.metal||'Steel';
  return {
    title:`Level 1 small-deal plan: ${metal} ${product} in ${region}`,
    summary:`With ${money(input.budget)} capital, Talmech should avoid physical stock and operate as a verified mediator. Work only on confirmed demand, supplier quote, and logistics margin. Keep cash exposure under ${money(maxExposure)} for calls, samples, travel, or small verification costs; do not lock capital in inventory until repeat demand is proven.`,
    metal,product,region,budget:input.budget,maxExposure,targetMargin:'2% to 6% brokerage/spread on material value + separate logistics coordination margin where possible',
    dealFlow:[
      'Pick one product + one region for the day. Do not chase every metal at once.',
      'Call buyers first and confirm grade, size, quantity, delivery city, payment terms and target rate.',
      'Search suppliers/manufacturers only after buyer demand is clear.',
      'Take supplier quote with validity time, GST, loading, dispatch timeline and stock proof.',
      'Calculate landed rate: material + GST + freight + loading/unloading + risk buffer + Talmech margin.',
      'Send written quote with short validity. Move lead into CRM and follow up the same day.'
    ],
    searchActions:[
      `${metal} ${product} suppliers in ${region}`,
      `${metal} ${product} dealers near ${region}`,
      `${metal} ${product} buyers in ${region}`,
      `${product} manufacturers ${region}`,
      `transporters ${region} industrial material truck`
    ],
    buyerQuestions:[
      'Which grade/specification do you need?',
      'What is your required quantity and delivery timeline?',
      'Do you need GST invoice and test certificate?',
      'What is your target landed rate and payment term?',
      'Do you buy monthly or only project-wise?'
    ],
    supplierQuestions:[
      'Do you have ready stock for this grade/size?',
      'What is today ex-works/basic rate and GST?',
      'What is the minimum order quantity?',
      'Can you share stock photo, MTC/grade confirmation and dispatch location?',
      'How long is the quote valid?'
    ],
    logisticsChecks:[
      'Confirm pickup and delivery city before final quote.',
      'Match vehicle to weight/length; long sections may need open body truck even for lower weight.',
      'Confirm loading/unloading responsibility and charges.',
      'Add toll, diesel variation, permit/city entry and waiting buffer.',
      'Keep transporter phone, vehicle number and payment condition in CRM.'
    ],
    riskControls:[
      'Do not purchase stock from your own capital in Phase 1.',
      'Do not give long validity in volatile metals.',
      'Never quote without grade, size, quantity and location.',
      'Avoid credit buyer unless verified and repeat customer.',
      'Keep screenshots, GST details, weighbridge proof and call notes.',
      'If margin is below expected risk, reject the deal and preserve capital.'
    ],
    todayActions:[
      `Search 20 ${product} buyers in ${region}.`,
      `Call 10 suppliers/manufacturers for ${metal} ${product}.`,
      'Add every contact to CRM with stage and next follow-up date.',
      'Create one WhatsApp poster and post in industrial groups.',
      'Target one confirmed requirement before spending any money.'
    ],
    marketingAngles:[
      'Verified regional supplier comparison',
      'Small quantity support without wasting buyer time',
      'Material + logistics coordination from one team',
      'Grade, quantity and delivery clarity before quote',
      'Fast sourcing for urgent industrial requirement'
    ]
  };
}

function posterSvg(opts:{metal:string;product:string;service:string;city:string;state:string;headline:string;body:string}){
  const headline=clean(opts.headline).slice(0,58);
  const body=clean(opts.body).slice(0,120);
  const sub=`${clean(opts.product)} | ${clean(opts.city)}, ${clean(opts.state)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#071427"/><stop offset="0.55" stop-color="#12345a"/><stop offset="1" stop-color="#06111f"/></linearGradient><linearGradient id="b" x1="0" x2="1"><stop stop-color="#35e0a1"/><stop offset="1" stop-color="#58a6ff"/></linearGradient></defs>
  <rect width="1080" height="1080" fill="url(#g)"/><circle cx="905" cy="110" r="180" fill="#35e0a1" opacity="0.12"/><circle cx="140" cy="920" r="220" fill="#58a6ff" opacity="0.12"/>
  <rect x="70" y="70" width="940" height="940" rx="54" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.22)"/>
  <text x="95" y="145" font-family="Arial" font-size="34" font-weight="800" fill="#bfffe8">Talmech Trading</text>
  <text x="95" y="225" font-family="Arial" font-size="62" font-weight="900" fill="#ffffff">${clean(opts.metal)}</text>
  <text x="95" y="295" font-family="Arial" font-size="46" font-weight="900" fill="#ffffff">${headline}</text>
  <rect x="95" y="340" width="760" height="62" rx="31" fill="url(#b)"/>
  <text x="125" y="381" font-family="Arial" font-size="28" font-weight="800" fill="#06111f">${sub}</text>
  <text x="95" y="480" font-family="Arial" font-size="34" font-weight="700" fill="#dcecff">${body}</text>
  <text x="95" y="585" font-family="Arial" font-size="30" fill="#b8c9dd">✓ Supplier search  ✓ Buyer matching  ✓ Logistics support</text>
  <text x="95" y="640" font-family="Arial" font-size="30" fill="#b8c9dd">✓ Grade clarity  ✓ Small quantity deals  ✓ Fast quote workflow</text>
  <rect x="95" y="750" width="410" height="86" rx="43" fill="url(#b)"/><text x="135" y="805" font-family="Arial" font-size="34" font-weight="900" fill="#06111f">Get a quote today</text>
  <text x="95" y="920" font-family="Arial" font-size="26" fill="#b8c9dd">AI-assisted metal trading, sourcing and logistics coordination</text>
  <text x="95" y="965" font-family="Arial" font-size="24" fill="#ffcc66">No fake stock claims. Final rates after supplier verification.</text>
  </svg>`;
}

export default function SmallDealCommandCenter(){
  const products=useMemo(()=>metalProducts,[ ]);
  const metals=Array.from(new Set(products.map(p=>p.metal)));
  const [budget,setBudget]=useState(10000);
  const [metal,setMetal]=useState('Steel');
  const [product,setProduct]=useState('MS Angles');
  const [state,setState]=useState('Maharashtra');
  const [city,setCity]=useState('Pune');
  const [customLocation,setCustomLocation]=useState('');
  const [dealModel,setDealModel]=useState(dealModels[0].name);
  const [service,setService]=useState(services[0]);
  const [plan,setPlan]=useState<Plan>(()=>fallbackPlan({budget,metal,product,city,state,dealModel,service}));
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('Built-in trading logic is active. Add OPENAI_API_KEY later for AI-generated strategy text.');
  const [posterHeadline,setPosterHeadline]=useState('Small quantity sourcing support');
  const [posterBody,setPosterBody]=useState('Send grade, size, quantity and delivery location. Talmech will compare suppliers and coordinate logistics.');
  const metalProductsList=products.filter(p=>p.metal===metal);
  const location=customLocation.trim() || city;

  function onMetal(next:string){
    setMetal(next);
    const first=products.find(p=>p.metal===next)?.product || '';
    setProduct(first);
  }

  async function generatePlan(){
    setLoading(true); setMessage('');
    const input={budget,metal,product,city:location,state,dealModel,service};
    try{
      const res=await fetch('/api/small-deal-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
      const data=await res.json();
      if(data?.plan){setPlan(data.plan); setMessage(data.source==='openai'?'AI plan generated with OpenAI.':'Plan generated with built-in low-budget trading logic.');}
      else{throw new Error(data?.error || 'Unable to generate plan');}
    }catch(e){
      setPlan(fallbackPlan(input));
      setMessage('Using offline fallback plan because AI/API is not configured or not reachable.');
    }finally{setLoading(false);}
  }

  function copy(text:string){navigator.clipboard?.writeText(text); setMessage('Copied.');}
  function openSearch(q:string){window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`,'_blank');}
  function openMaps(q:string){window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}`,'_blank');}
  function addOpportunityToCrm(){
    const saved=JSON.parse(localStorage.getItem('talmech-crm-leads')||'[]');
    saved.unshift({id:Date.now(),type:'opportunity',company:`Small deal opportunity - ${metal} ${product}`,phone:'',email:'',city:location,state,metal,industry:service,stage:'New',notes:plan.summary,createdAt:new Date().toISOString()});
    localStorage.setItem('talmech-crm-leads',JSON.stringify(saved));
    setMessage('Small deal opportunity added to CRM.');
  }
  function downloadPoster(){
    const svg=posterSvg({metal,product,service,city:location,state,headline:posterHeadline,body:posterBody});
    const blob=new Blob([svg],{type:'image/svg+xml'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`talmech-${metal.toLowerCase()}-${product.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-poster.svg`; a.click(); URL.revokeObjectURL(url);
  }
  const pitch=`Hello, I am from Talmech Trading. We help with ${product} / ${metal} sourcing for small and medium quantities in ${location}. Share grade, size, quantity, delivery city and target rate. We compare verified suppliers, coordinate logistics and send a clear landed quote with short validity.`;
  const manualQueries=plan.searchActions || [];

  return <main className="container section smallDeals">
    <span className="eyebrow">Phase 1: ₹10k capital discipline</span>
    <h1 className="pageTitle">Small Deal AI Command Center</h1>
    <p className="lead">Use this page when you do not want to hold stock. It helps Talmech find small profitable opportunities, build buyer/supplier calls, arrange logistics and create marketing creatives for WhatsApp, LinkedIn and local groups.</p>

    <section className="grid cards4">
      <div className="card"><b>Capital rule</b><p className="price">{money(budget)}</p><p className="muted">Do not lock this in inventory. Use it for verification, calling, travel and lead generation.</p></div>
      <div className="card"><b>Max cash exposure</b><p className="price">{money(Math.min(budget*.25,2500))}</p><p className="muted">Per deal until buyer + supplier + logistics are verified.</p></div>
      <div className="card"><b>Target model</b><p className="price">2–6%</p><p className="muted">Brokerage/spread plus logistics coordination margin.</p></div>
      <div className="card"><b>Best first move</b><p className="price">Demand first</p><p className="muted">Find buyer requirement before supplier commitment.</p></div>
    </section>

    <section className="panel sectionTight">
      <div className="row"><div><h2>Generate small-deal strategy</h2><p className="muted">Select one product and one region. The system creates a practical call/search/action plan.</p></div><button className="btn" onClick={generatePlan} disabled={loading}>{loading?'Generating...':'Generate strategy'}</button></div>
      <div className="dealForm">
        <label>Budget<input className="input" type="number" value={budget} min={1000} onChange={e=>setBudget(Number(e.target.value||0))}/></label>
        <label>Metal<select value={metal} onChange={e=>onMetal(e.target.value)}>{metals.map(m=><option key={m}>{m}</option>)}</select></label>
        <label>Product<select value={product} onChange={e=>setProduct(e.target.value)}>{metalProductsList.map(p=><option key={p.product}>{p.product}</option>)}</select></label>
        <label>Deal model<select value={dealModel} onChange={e=>setDealModel(e.target.value)}>{dealModels.map(m=><option key={m.name}>{m.name}</option>)}</select></label>
        <label>State<select value={state} onChange={e=>{setState(e.target.value);setCity(getCitiesForState(e.target.value)[0]||'')}}>{indiaLocations.map(s=><option key={s.state}>{s.state}</option>)}</select></label>
        <label>City<select value={city} onChange={e=>setCity(e.target.value)}>{getCitiesForState(state).map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Custom location<input className="input" value={customLocation} onChange={e=>setCustomLocation(e.target.value)} placeholder="MIDC Chakan, Bhosari, GIDC, market area"/></label>
        <label>Service<select value={service} onChange={e=>setService(e.target.value)}>{services.map(s=><option key={s}>{s}</option>)}</select></label>
      </div>
      {message && <p className="warn">{message}</p>}
    </section>

    <section className="grid cards2">
      <div className="card"><h2>{plan.title}</h2><p className="muted">{plan.summary}</p><p><b>Target margin:</b> {plan.targetMargin}</p><button className="btn" onClick={addOpportunityToCrm}>Add opportunity to CRM</button></div>
      <div className="card"><h2>Deal models to use</h2>{dealModels.map(m=><p key={m.name}><b>{m.name}</b> <span className="badge">{m.risk}</span><br/><span className="muted">{m.note}</span></p>)}</div>
    </section>

    <section className="grid cards3">
      <div className="card"><h2>Today action plan</h2>{plan.todayActions.map(x=><p key={x}>✅ {x}</p>)}</div>
      <div className="card"><h2>Buyer call questions</h2>{plan.buyerQuestions.map(x=><p key={x}>• {x}</p>)}<button className="btn secondary" onClick={()=>copy(pitch)}>Copy buyer pitch</button></div>
      <div className="card"><h2>Supplier verification</h2>{plan.supplierQuestions.map(x=><p key={x}>• {x}</p>)}</div>
    </section>

    <section className="grid cards2">
      <div className="card"><h2>Search engine shortcuts</h2><p className="muted">Open these, verify details, then add contacts to CRM. This saves API cost.</p><div className="stackBtns">{manualQueries.map(q=><span className="row" key={q}><button className="btn secondary" onClick={()=>openSearch(q)}>Google: {q}</button><button className="btn secondary" onClick={()=>openMaps(q)}>Maps</button></span>)}</div></div>
      <div className="card"><h2>Risk controls</h2>{plan.riskControls.map(x=><p key={x}>🛡 {x}</p>)}<h3>Logistics checks</h3>{plan.logisticsChecks.map(x=><p key={x}>🚚 {x}</p>)}</div>
    </section>

    <section className="panel">
      <div className="row"><div><span className="eyebrow">Marketing creative generator</span><h2>Generate shareable poster + prompt</h2><p className="muted">Create a social/WhatsApp image for selected metal/service. Download as SVG and share after editing phone number if needed.</p></div><button className="btn" onClick={downloadPoster}>Download poster SVG</button></div>
      <div className="dealForm posterControls">
        <label>Poster headline<input className="input" value={posterHeadline} onChange={e=>setPosterHeadline(e.target.value)}/></label>
        <label>Poster body<input className="input" value={posterBody} onChange={e=>setPosterBody(e.target.value)}/></label>
      </div>
      <div className="posterPreview"><div><b>Talmech Trading</b><h2>{metal}</h2><h3>{posterHeadline}</h3><span>{product} | {location}, {state}</span><p>{posterBody}</p><small>Supplier search • Buyer matching • Logistics coordination • Small quantity deals</small></div></div>
      <div className="card noShadow"><b>AI image prompt</b><p className="muted">Copy this into any image tool when you want a more polished creative.</p><textarea className="input" readOnly value={`Create a premium B2B industrial social media poster for Talmech Trading about ${metal} ${product} ${service} in ${location}, ${state}. Theme: dark navy industrial, green-blue gradient accents, professional Indian metal trading marketplace. Include text: '${posterHeadline}'. Include subtext: '${posterBody}'. Add icons for verified supplier, buyer matching, logistics coordination and small quantity support. Make it trustworthy, modern, mobile-friendly, 1080x1080, no fake claims, no clutter.`}/><button className="btn secondary" onClick={()=>copy(`Create a premium B2B industrial social media poster for Talmech Trading about ${metal} ${product} ${service} in ${location}, ${state}. Theme: dark navy industrial, green-blue gradient accents, professional Indian metal trading marketplace. Include text: '${posterHeadline}'. Include subtext: '${posterBody}'. Add icons for verified supplier, buyer matching, logistics coordination and small quantity support. Make it trustworthy, modern, mobile-friendly, 1080x1080, no fake claims, no clutter.`)}>Copy image prompt</button></div>
    </section>
  </main>;
}
