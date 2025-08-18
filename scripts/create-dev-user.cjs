'use strict';

/**
 * Dev-only helper to create a confirmed auth user and ensure a profile row exists.
 * Requires SUPABASE_SERVICE_ROLE and VITE_SUPABASE_URL in environment.
 * Do NOT ship service role key to client. Run from Node only.
 */

const https = require('https');

function requestJson(method, url, headers, body) {
	return new Promise((resolve, reject) => {
		const u = new URL(url);
		const req = https.request(
			{
				method,
				hostname: u.hostname,
				path: u.pathname + u.search,
				headers: {
					'content-type': 'application/json',
					...headers,
				},
			},
			(res) => {
				let data = '';
				res.on('data', (d) => (data += d));
				res.on('end', () => {
					const isOk = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;
					try {
						const parsed = data ? JSON.parse(data) : {};
						if (isOk) return resolve(parsed);
						return reject(new Error(`HTTP ${res.statusCode}: ${data || ''}`));
					} catch (e) {
						if (isOk) return resolve({});
						return reject(new Error(`HTTP ${res.statusCode}: ${data || ''}`));
					}
				});
			}
		);
		req.on('error', reject);
		if (body) req.write(JSON.stringify(body));
		req.end();
	});
}

async function main() {
	const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
	const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
	if (!SUPABASE_URL || !SERVICE_ROLE) {
		console.error('Missing VITE_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE env');
		process.exit(1);
	}

	const email = process.env.DEV_USER_EMAIL || 'admin@example.com';
	const password = process.env.DEV_USER_PASSWORD || 'StrongPassw0rd!';
	const fullName = process.env.DEV_USER_NAME || 'Admin User';
	const department = process.env.DEV_USER_DEPT || 'E&M';
	const role = process.env.DEV_USER_ROLE || 'dev';

	const base = SUPABASE_URL.replace(/\/$/, '');

	// 1) Create confirmed user via Admin API (or fetch if already exists)
	let userId = null;
	try {
		const created = await requestJson(
			'POST',
			`${base}/auth/v1/admin/users`,
			{ apikey: SERVICE_ROLE, authorization: `Bearer ${SERVICE_ROLE}` },
			{
				email,
				password,
				email_confirm: true,
				user_metadata: { name: fullName, role, department },
			}
		);
		userId = created?.id || created?.user?.id || null;
		console.log('Dev auth user created');
	} catch (err) {
		console.warn('Create user returned error, attempting to fetch existing:', err.message);
		const query = new URLSearchParams({ email }).toString();
		const found = await requestJson(
			'GET',
			`${base}/auth/v1/admin/users?${query}`,
			{ apikey: SERVICE_ROLE, authorization: `Bearer ${SERVICE_ROLE}` }
		);

		// Handle either array response or object with users[]
		const users = Array.isArray(found) ? found : (Array.isArray(found?.users) ? found.users : []);
		if (users.length > 0) {
			userId = users[0].id;
			console.log('Existing user found');
		} else if (found?.id) {
			userId = found.id;
			console.log('Existing user found');
		} else {
			throw new Error('Failed to create or find user');
		}
	}

	if (!userId) {
		throw new Error('User ID not found after admin operations');
	}

	// 2) Ensure profile row via PostgREST upsert (id is required by schema)
	await requestJson(
		'POST',
		`${base}/rest/v1/profiles?on_conflict=id`,
		{
			apikey: SERVICE_ROLE,
			authorization: `Bearer ${SERVICE_ROLE}`,
			prefer: 'resolution=merge-duplicates',
		},
		[
			{
				id: userId,
				email,
				full_name: fullName,
				role,
				department,
				is_active: true,
			},
		]
	);

	console.log('Profile ensured');
}

main().catch((err) => {
	console.error('Seed failed:', err.message || err);
	process.exit(1);
});


