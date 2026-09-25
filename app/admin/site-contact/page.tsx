import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function SiteContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase.from('profiles').select('role,email').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/admin/login');

  const { data: contact } = await supabase.from('site_contacts').select('*').eq('id', 1).single();

  async function saveContacts(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/admin/login');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') redirect('/admin/login');

    const updates = String(formData.get('updates_giveaway_url') || '').trim();
    const whatsapp = String(formData.get('whatsapp_channel_url') || '').trim();
    const support = String(formData.get('customer_support_url') || '').trim();

    if (!validUrl(updates) || !validUrl(whatsapp) || !validUrl(support)) {
      redirect('/admin/site-contact?error=invalid-url');
    }

    const { error } = await supabase.from('site_contacts').update({
      updates_giveaway_url: updates,
      whatsapp_channel_url: whatsapp,
      customer_support_url: support,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    if (error) redirect('/admin/site-contact?error=save-failed');
    revalidatePath('/', 'layout');
    redirect('/admin/site-contact?saved=1');
  }

  return <main className="container" style={{padding:'40px 0 70px'}}>
    <div className="nav"><div><div className="brand">Site Contact</div><div className="muted">Edit the floating customer contact buttons</div></div></div>
    <section className="section">
      <div className="card" style={{maxWidth:760}}>
        <h2>Floating contact links</h2>
        <p className="muted">These links appear at the bottom-left of the site and stay visible while customers scroll.</p>
        {contact && <form action={saveContacts}>
          <label>UPDATE &amp; GIVEAWAY<input name="updates_giveaway_url" type="url" required defaultValue={contact.updates_giveaway_url} style={{width:'100%',padding:12,margin:'8px 0 18px',border:'1px solid #e5e7eb',borderRadius:10}} /></label>
          <label>WHATSAPP CHANNEL<input name="whatsapp_channel_url" type="url" required defaultValue={contact.whatsapp_channel_url} style={{width:'100%',padding:12,margin:'8px 0 18px',border:'1px solid #e5e7eb',borderRadius:10}} /></label>
          <label>CUSTOMER SUPPORT<input name="customer_support_url" type="url" required defaultValue={contact.customer_support_url} style={{width:'100%',padding:12,margin:'8px 0 18px',border:'1px solid #e5e7eb',borderRadius:10}} /></label>
          <button className="btn primary" type="submit">Save Site Contact</button>
        </form>}
      </div>
    </section>
  </main>;
}
