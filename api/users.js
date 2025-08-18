// Vercel Serverless Function: Manage users with Supabase Admin API (server-side)
// Methods:
//  - POST /api/users  -> create user (admin only)

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

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { email, password, name, role, department, employee_id } = body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const base = SUPABASE_URL.replace(/\/$/, '');

    // 1) Create confirmed auth user
    const createResp = await fetch(`${base}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, department, employee_id },
      }),
    });

    if (!createResp.ok) {
      const txt = await createResp.text();
      return res.status(createResp.status).json({ error: 'Failed to create auth user', details: txt });
    }
    const created = await createResp.json();
    const userId = created?.id || created?.user?.id;
    if (!userId) {
      return res.status(500).json({ error: 'Auth user id not returned' });
    }

    // 2) Upsert profile
    const profResp = await fetch(`${base}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify([
        {
          id: userId,
          email,
          full_name: name,
          role: role || 'technician',
          department: department || null,
          employee_id: employee_id || null,
          is_active: true,
        },
      ]),
    });

    if (!profResp.ok) {
      const ptxt = await profResp.text();
      // not fatal for creation; return 201 with warning
      return res.status(201).json({ id: userId, warning: 'Profile upsert failed', details: ptxt });
    }

    return res.status(201).json({ id: userId });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err?.message || String(err) });
  }
}


