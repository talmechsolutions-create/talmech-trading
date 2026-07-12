import {NextResponse} from 'next/server';
import { rateLimitResponse } from '@/lib/security/rateLimit';

type Req={budget:number;metal:string;product:string;city:string;state:string;dealModel:string;service:string};
const money=(n:number)=>`₹${Math.round(n).toLocaleString('en-IN')}`;

function builtInPlan(input:Req){
  const budget=Number(input.budget||10000);
  const maxExposure=Math.min(budget*.25,2500);
  const region=`${input.city}, ${input.state}`;
  const product=input.product||'metal product';
  const metal=input.metal||'Steel';
  return {
    title:`Level 1 small-deal plan: ${metal} ${product} in ${region}`,
    summary:`Start as a no-inventory mediator. With ${money(budget)}, do not buy stock. Use the budget for lead finding, calling, verification, local travel and samples only. Keep cash exposure below ${money(maxExposure)} until buyer demand, supplier stock, material grade and logistics cost are confirmed.`,
    metal,product,region,budget,maxExposure,
    targetMargin:'2% to 6% material brokerage/spread + logistics coordination margin. Reject deals where risk is bigger than margin.',
    dealFlow:['Buyer demand first','Supplier verification second','Logistics quote third','Written landed quotation fourth','CRM follow-up until won/lost'],
    searchActions:[`${metal} ${product} suppliers in ${region}`,`${metal} ${product} dealers in ${region}`,`${product} buyers in ${region}`,`${metal} stockist near ${region}`,`industrial transporters ${region}`],
    buyerQuestions:['Grade/specification required?','Quantity and monthly repeat demand?','Required size/form and delivery location?','GST invoice and certificate required?','Payment term and target landed rate?'],
    supplierQuestions:['Ready stock available?','Exact grade, size, form and minimum quantity?','Today rate, GST and quote validity?','Pickup location, loading charges and dispatch timeline?','Can you share stock photo, GST details, MTC or test proof?'],
    logisticsChecks:['Confirm pickup/delivery before final quotation','Match vehicle by weight and material length','Add loading/unloading, toll, diesel and waiting buffer','Use transporter confirmation before buyer quote','Track vehicle/payment notes in CRM'],
    riskControls:['No inventory purchase in Phase 1','No long credit deals','No quote without grade/size/quantity/location','No large commitment from WhatsApp-only supplier','Keep screenshots, GST, weighbridge and call notes','Use short quote validity in volatile metals'],
    todayActions:[`Call 20 buyers for ${product} in ${region}`,`Call 10 suppliers for ${metal} ${product}`,`Find 3 logistics contacts for ${region}`,`Post 1 marketing creative in local industrial groups`,`Move every reply into CRM stage`],
    marketingAngles:['Small quantity support','Verified supplier comparison','Fast landed quote','Material plus logistics coordination','Grade-focused trading support']
  };
}

export async function POST(req:Request){
  const limited = await rateLimitResponse(req, { keyPrefix: 'small-deal-advisor', limit: 12, windowMs: 15 * 60 * 1000 });
  if (limited) return limited;

  const input=(await req.json()) as Req;
  const fallback=builtInPlan(input);
  if(!process.env.OPENAI_API_KEY){return NextResponse.json({source:'built-in',plan:fallback});}
  try{
    const prompt=`You are a practical Indian metal trading mentor. Create a strict low-budget small-deal plan for a broker with capital ${input.budget}. Metal: ${input.metal}. Product: ${input.product}. Region: ${input.city}, ${input.state}. Deal model: ${input.dealModel}. Service: ${input.service}. Return only compact JSON with same keys as this example: ${JSON.stringify(fallback)}. Never guarantee profit. Focus on no-inventory brokerage, buyer-first workflow, supplier verification, logistics margin, risk controls and daily calls.`;
    const res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:prompt}],temperature:.4,response_format:{type:'json_object'}})});
    if(!res.ok) throw new Error(await res.text());
    const data=await res.json();
    const txt=data.choices?.[0]?.message?.content;
    const parsed=JSON.parse(txt);
    return NextResponse.json({source:'openai',plan:{...fallback,...parsed}});
  }catch(error){return NextResponse.json({source:'built-in',plan:fallback,warning:'OpenAI unavailable; built-in plan used.'});}
}
