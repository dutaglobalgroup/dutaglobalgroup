import { currentUser } from './email-auth';
import { json } from './project-store';

// Protect the data itself, not just the dashboard's buttons.
export async function requireReader(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user || user.status !== 'approved') return json({ error: 'Silakan masuk dengan akun yang telah disetujui admin.', code: 'login_required' }, 401);
    return null;
  } catch {
    return json({ error: 'Akses belum dapat diverifikasi. Coba kembali.', code: 'session_unavailable' }, 503);
  }
}
