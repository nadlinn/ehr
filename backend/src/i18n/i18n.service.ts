import { Injectable } from '@nestjs/common';
import * as i18n from 'i18n';

@Injectable()
export class I18nService {
  constructor() {
    // Configure i18n
    i18n.configure({
      locales: ['en', 'es'],
      directory: __dirname + '/locales',
      defaultLocale: 'en',
      fallbacks: { 'es': 'en' },
      objectNotation: true,
    });
  }

  translate(key: string, language: string = 'en', options?: any): string {
    i18n.setLocale(language);
    return i18n.__(key, options);
  }

  getSupportedLanguages(): string[] {
    return ['en', 'es'];
  }

  isLanguageSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language);
  }
}
