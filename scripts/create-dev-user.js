'use strict';

/**
 * Dev-only helper to create a confirmed auth user and ensure a profile row exists.
 * Requires SUPABASE_SERVICE_ROLE and VITE_SUPABASE_URL in environment.
 * Do NOT ship service role key to client. Run from Node only.
 */

const https = require('https');

function postJson(url, headers, body) {
	return new Promise((resolve, reject) => {
		const u = new URL(url);
		const req = https.request(
			{
				method: 'POST',
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
					if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
						try {
							resolve(JSON.parse(data || '{}'));
						} catch {
							resolve({});
						}
					} else {
						reject(new Error(`HTTP ${res.statusCode}: ${data}`));
					}
				});
			}
		);
		req.on('error', reject);
		req.write(JSON.stringify(body));
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

	const email = process.env.DEV_USER_EMAIL || 'syedhunainalizaidi@gmail.com';
	const password = process.env.DEV_USER_PASSWORD || 'APPLE_1414';
	const fullName = process.env.DEV_USER_NAME || 'Syed Hunain Ali';
	const department = process.env.DEV_USER_DEPT || 'E&M SYSTEMS';
	const role = process.env.DEV_USER_ROLE || 'dev';

	// 1) Create confirmed user via Admin API
	await postJson(
		`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`,
		{ apikey: SERVICE_ROLE, authorization: `Bearer ${SERVICE_ROLE}` },
		{
			email,
			password,
			email_confirm: true,
			user_metadata: { name: fullName, role, department },
		}
	);

	console.log('Dev auth user created/exists');

	// 2) Ensure profile row via SQL RPC or REST (use service role to bypass RLS)
	// Using PostgREST for simplicity
	await postJson(
		`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles?on_conflict=id`,
		{
			apikey: SERVICE_ROLE,
			authorization: `Bearer ${SERVICE_ROLE}`,
			prefer: 'resolution=merge-duplicates',
		},
		[
			{
				email,
				full_name: fullName,
				role,
				department,
				is_active: true,
			}
		]
	);

	console.log('Profile ensured');
}

main().catch((err) => {
	console.error('Seed failed:', err.message || err);
	process.exit(1);
});


