export const workspaceAccessCodeLength = 12;

export function normalizeWorkspaceAccessCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, workspaceAccessCodeLength);
}

export function isWorkspaceAccessCodeComplete(value: string): boolean {
  return new RegExp(`^\\d{${workspaceAccessCodeLength}}$`).test(value);
}

export function formatWorkspaceAccessCode(value: string): string {
  return normalizeWorkspaceAccessCode(value).replace(/(\d{4})(?=\d)/g, '$1 ');
}
