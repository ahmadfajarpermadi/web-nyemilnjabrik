import { debugError } from './supabase.js';

const errorMessages = {
  invalid_credentials: 'Email atau password tidak cocok.',
  email_not_confirmed: 'Email belum dikonfirmasi. Cek inbox Anda dulu.',
  user_already_exists: 'Email sudah terdaftar. Silakan login.',
  signup_disabled: 'Pendaftaran sedang dinonaktifkan di Supabase.',
  weak_password: 'Password terlalu lemah. Gunakan minimal 8 karakter.',
  validation_failed: 'Data belum valid. Periksa kembali form Anda.',
  insufficient_privilege: 'Akses ditolak oleh kebijakan keamanan database.',
  permission_denied: 'Akses ditolak oleh kebijakan keamanan database.',
  row_level_security: 'Akses data ditolak oleh Row Level Security.',
  storage_unauthorized: 'Upload ditolak oleh kebijakan Storage.'
};

export function getFriendlyError(error, fallback = 'Terjadi kendala. Silakan coba lagi.') {
  const code = error?.code || error?.name;
  const message = error?.message || '';
  const status = error?.status;

  if (code && errorMessages[code]) return errorMessages[code];
  if (message.toLowerCase().includes('row-level security')) return errorMessages.row_level_security;
  if (message.toLowerCase().includes('permission denied')) return errorMessages.permission_denied;
  if (message.toLowerCase().includes('already registered')) return errorMessages.user_already_exists;
  if (message.toLowerCase().includes('invalid login credentials')) return errorMessages.invalid_credentials;
  if (message.toLowerCase().includes('email not confirmed')) return errorMessages.email_not_confirmed;
  if (status === 422) return 'Signup ditolak. Pastikan email valid, password minimal 8 karakter, dan email belum terdaftar.';
  if (message) return message;
  return fallback;
}

export function reportError(scope, error) {
  debugError(scope, error);
  return getFriendlyError(error);
}
