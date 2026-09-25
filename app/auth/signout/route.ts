import {createClient} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';
export async function POST(request:Request){const supabase=await createClient();await supabase.auth.signOut();const url=new URL(request.url);const next=url.searchParams.get('next')||'/admin/login';return NextResponse.redirect(new URL(next,url.origin));}
