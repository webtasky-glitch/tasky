export const DEFAULT_STANDARD_PASSWORD = '123456';
export const APP_LOGIN_URL = 'https://webtasky.com';

export interface WelcomeEmailParams {
  name: string;
  email: string;
  password?: string;
  orgName?: string;
  role?: string;
  rank?: string;
  appUrl?: string;
}

export function generateWelcomeEmailSubject(name?: string): string {
  return name ? `Welcome to Tasky, ${name}! Your Account Credentials` : `Welcome to Tasky! Your Account Credentials`;
}

export function generateWelcomeEmailBody(params: WelcomeEmailParams): string {
  const {
    name,
    email,
    password = DEFAULT_STANDARD_PASSWORD,
    orgName,
    role,
    rank,
    appUrl = APP_LOGIN_URL
  } = params;

  const greeting = name ? `Hello ${name},` : `Hello,`;
  const workspaceText = orgName ? ` (${orgName})` : '';
  const roleText = role ? `\nRole: ${role}${rank ? ` (${rank})` : ''}` : '';

  return `${greeting}

Welcome to Tasky! Thank you for joining our workspace${workspaceText}.

Your account has been created by the workspace administrator. Below are your standard login credentials:

📧 Email: ${email}
🔑 Password: ${password}
🌐 Login URL: ${appUrl}${roleText}

You can log in now to organize your tasks, collaborate on projects, track goals, and manage your team workflow.

If you have any questions or require assistance, please reply to this email or contact your workspace manager.

Best regards,
Tasky Team
${appUrl}`;
}

export function getGmailComposeUrl(params: { to: string; subject: string; body: string }): string {
  const { to, subject, body } = params;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getMailtoUrl(params: { to: string; subject: string; body: string }): string {
  const { to, subject, body } = params;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function openGmailCompose(params: { to: string; subject: string; body: string }): void {
  const url = getGmailComposeUrl(params);
  window.open(url, '_blank', 'noopener,noreferrer');
}
