import {NextResponse} from 'next/server';import {metals} from '@/lib/data';export async function GET(){return NextResponse.json({success:true,data:metals,updatedAt:new Date().toISOString()})}
