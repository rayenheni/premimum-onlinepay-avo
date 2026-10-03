// Removes data/settings created by automated browser tests only.
import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const run = async (q) => (await pool.query(q)).rowCount;
await run("delete from admin_users where email like 'e2e-%@example.tn'");
await run("delete from articles where slug like 'e2e-%'");
await run("delete from consultation_requests where email like 'e2e-%@example.tn'");
await run("delete from cabinet_inquiries where email like 'e2e-%@example.tn'");
await run("delete from site_settings where key in ('contentOverrides:ar','contentOverrides:fr','extraOverrides:ar','extraOverrides:fr','adminPath','contactEmail','notificationEmail','contactPhone','whatsapp','address','facebookUrl','linkedinUrl','seoIndexing','officeStart','officeEnd','slotMinutes','logoUrl','heroImage','aboutImage','pageHeroImage','bannerImage','journeyImage','introVideoUrl')");
await run("delete from cms_pages");
await run("delete from content_revisions");
await run("delete from admin_audit_logs where admin_id is null");
await run("delete from media_assets where filename like 'article-family%' or filename like 'e2e-%'");
console.log('E2E cleanup complete; remaining admin accounts:', (await pool.query('select count(*)::int n from admin_users')).rows[0].n);
await pool.end();
