import fs from 'fs';
import path from 'path';

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'tmp', 'emails');
  await fs.promises.mkdir(dir, { recursive: true });
  const file = path.join(dir, 'password-reset-' + stamp + '.txt');

  const lines = [
    'TO: ' + to,
    'SUBJECT: Reset your password',
    '',
    'Click the link to reset your password:',
    resetLink,
    '',
    'If you did not request this, you can ignore this email.'
  ];
  const content = lines.join('\n');

  await fs.promises.writeFile(file, content, 'utf8');
  console.log('[mailer] password reset email written to ' + file + ' for ' + to);
}
