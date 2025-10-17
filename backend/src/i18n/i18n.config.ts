import { registerAs } from '@nestjs/config';

export default registerAs('i18n', () => ({
  fallbackLanguage: 'en',
  supportedLanguages: ['en', 'es'],
  defaultLanguage: 'en',
}));
