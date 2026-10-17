export { createAuth, type Auth, type AuthConfig, type AuthMailer } from './create-auth';
export { passwordHasher } from './password';
export { AUTH_BASE_PATH } from './create-auth';
export {
  localeFromRequestHeaders,
  resolveSignupLocale,
  SIGNUP_LOCALE_HEADER,
} from './signup-locale';