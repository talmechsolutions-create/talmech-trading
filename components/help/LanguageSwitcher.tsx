'use client';

import Link from 'next/link';
import { HelpLanguage, supportedLanguages } from '@/data/helpGuides';

type LanguageSwitcherProps = {
  value: HelpLanguage;
  onChange: (language: HelpLanguage) => void;
};

export default function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  return (
    <div className="helpLanguageSwitcher" aria-label="Choose help language">
      {supportedLanguages.map((language) => (
        <Link
          href={`/how-it-works?lang=${language.code}`}
          key={language.code}
          data-language={language.code}
          className={value === language.code ? 'active' : ''}
          onClick={(event) => {
            event.preventDefault();
            onChange(language.code);
          }}
        >
          <span>{language.label}</span>
          <small>{language.shortLabel}</small>
        </Link>
      ))}
    </div>
  );
}
