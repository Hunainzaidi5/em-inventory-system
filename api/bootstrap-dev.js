// Ensure a default dev user exists (server-side)

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'Missing Supabase server configuration' });
    }

    const email = process.env.DEV_EMAIL || 'syedhunainalizaidi@gmail.com';
    const password = process.env.DEV_PASSWORD || 'StrongPassw0rd!';
    const name = process.env.DEV_NAME || 'Syed Hunain Ali';
    const department = process.env.DEV_DEPARTMENT || 'E&M SYSTEMS';
    const role = process.env.DEV_ROLE || 'dev';

    const base = SUPABASE_URL.replace(/\/$/, '');

    // try to find existing
    let userId = null;
    const findResp = await fetch(`${base}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
    });
    if (findResp.ok) {
      const found = await findResp.json();
      const users = Array.isArray(found) ? found : (Array.isArray(found?.users) ? found.users : []);
      if (users.length) userId = users[0].id;
    }

    // create if not exist
    if (!userId) {
      const createResp = await fetch(`${base}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role, department },
        }),
      });
      if (!createResp.ok) {
        const t = await createResp.text();
        return res.status(createResp.status).json({ error: 'Failed to create dev user', details: t });
      }
      const created = await createResp.json();
      userId = created?.id || created?.user?.id;
    }

    if (!userId) return res.status(500).json({ error: 'Dev user id missing' });

    // upsert profile
    await fetch(`${base}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([
        { id: userId, email, full_name: name, role, department, is_active: true },
      ]),
    });

    return res.status(201).json({ id: userId, email });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err?.message || String(err) });
  }
}


