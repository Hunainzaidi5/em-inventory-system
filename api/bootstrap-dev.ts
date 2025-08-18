export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
  if (!baseUrl || !serviceRole) {
    return res.status(500).json({ error: 'Missing SUPABASE env' });
  }

  const email = process.env.DEV_USER_EMAIL;
  const password = process.env.DEV_USER_PASSWORD;
  const fullName = process.env.DEV_USER_NAME;
  const department = process.env.DEV_USER_DEPT || '';
  const role = process.env.DEV_USER_ROLE || 'dev';
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing DEV_USER_* env variables' });
  }

  const headers = {
    apikey: serviceRole,
    authorization: `Bearer ${serviceRole}`,
    'content-type': 'application/json',
  } as Record<string, string>;

  const toJson = (b: unknown) => JSON.stringify(b);

  try {
    // Try to create confirmed user
    const createRes = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: toJson({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: fullName, role, department },
      }),
    });

    let userId: string | null = null;
    if (createRes.ok) {
      const created = await createRes.json();
      userId = created?.id || created?.user?.id || null;
    } else {
      // Fetch existing
      const getRes = await fetch(`${baseUrl.replace(/\/$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
        headers,
      });
      if (getRes.ok) {
        const found = await getRes.json();
        const users = Array.isArray(found) ? found : (Array.isArray(found?.users) ? found.users : []);
        userId = users?.[0]?.id || found?.id || null;
      }
    }

    if (!userId) {
      return res.status(500).json({ error: 'Failed to create or find dev user' });
    }

    // Ensure profile via upsert
    const profRes = await fetch(`${baseUrl.replace(/\/$/, '')}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: { ...headers, prefer: 'resolution=merge-duplicates' },
      body: toJson([
        {
          id: userId,
          email,
          full_name: fullName,
          role,
          department,
          is_active: true,
        },
      ]),
    });

    if (!profRes.ok && profRes.status !== 409) {
      const txt = await profRes.text();
      return res.status(500).json({ error: 'Failed to ensure dev profile', details: txt });
    }

    return res.status(200).json({ ok: true, userId });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Bootstrap failed' });
  }
}



