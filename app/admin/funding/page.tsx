import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function reviewFunding(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') redirect('/admin/login');

  const id = String(formData.get('id'));
  const approve = formData.get('decision') === 'approve';
  const note = String(formData.get('admin_note') || '').trim().slice(0, 500);
  const admin = createAdminClient();

  const { error } = await admin.rpc('admin_approve_manual_funding', {
    p_request_id: id,
    p_admin_id: user.id,
    p_approve: approve,
    p_admin_note: note || null,
  });
  if (error) return;
  revalidatePath('/admin/funding');
  revalidatePath('/admin');
  revalidatePath('/account');
}

export default async function FundingAdmin({searchParams}:{searchParams:Promise<{status?:string,customer?:string}>}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') redirect('/admin/login');

  const {status,customer}=await searchParams;
  let requestQuery = supabase.from('funding_requests')
    .select('id,customer_id,amount_ngn,method,status,payment_reference,receipt_path,customer_note,admin_note,created_at,customer:profiles!funding_requests_customer_id_fkey(full_name,email)')
    .order('created_at', { ascending: false });
  if(status && ['pending','approved','rejected'].includes(status)) requestQuery=requestQuery.eq('status',status);
  if(customer) requestQuery=requestQuery.eq('customer_id',customer);
  const { data: requests } = await requestQuery;

  const admin = createAdminClient();
  const withUrls = await Promise.all((requests || []).map(async (r: any) => {
    let receiptUrl = null;
    if (r.receipt_path) {
      const signed = await admin.storage.from('payment-receipts').createSignedUrl(r.receipt_path, 600);
      receiptUrl = signed.data?.signedUrl || null;
    }
    return { ...r, receiptUrl };
  }));

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <p><a href="/admin">← Dashboard</a></p>
      <h1>Funding & receipt review</h1><div className="actions"><a className="btn secondary" href="/admin/funding">All</a><a className="btn secondary" href="/admin/funding?status=pending">Pending</a><a className="btn secondary" href="/admin/funding?status=approved">Approved</a><a className="btn secondary" href="/admin/funding?status=rejected">Rejected</a></div>
      <div style={{ display: 'grid', gap: 12 }}>
        {withUrls.map((r: any) => (
          <div className="card" key={r.id}>
            <h3>{r.customer?.full_name || r.customer?.email || 'Customer'}</h3>
            <p>Amount: <strong>₦{Number(r.amount_ngn).toLocaleString()}</strong> · Method: {r.method} · Status: {r.status}</p>
            {r.payment_reference && <p>Payment reference: {r.payment_reference}</p>}
            {r.customer_note && <p>Customer note: {r.customer_note}</p>}
            {r.receiptUrl && <p><a className="btn secondary" href={r.receiptUrl} target="_blank" rel="noreferrer">View receipt</a></p>}
            {r.status === 'pending' && r.method === 'manual' && (
              <form action={reviewFunding} style={{ display: 'grid', gap: 8 }}>
                <input type="hidden" name="id" value={r.id} />
                <textarea name="admin_note" placeholder="Optional admin note" />
                <div className="actions">
                  <button className="btn primary" name="decision" value="approve">Approve & add balance</button>
                  <button className="btn secondary" name="decision" value="reject">Reject</button>
                </div>
              </form>
            )}
            <small>{new Date(r.created_at).toLocaleString()}</small>
          </div>
        ))}
        {!withUrls.length && <p>No funding requests yet.</p>}
      </div>
    </main>
  );
}
