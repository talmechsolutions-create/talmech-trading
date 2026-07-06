'use client';

import Link from 'next/link';
import { HelpLanguage, helpPageContent, helpText } from '@/data/helpGuides';
import LanguageSwitcher from '@/components/help/LanguageSwitcher';

type HelpHeroProps = {
  language: HelpLanguage;
  onLanguageChange: (language: HelpLanguage) => void;
};

export default function HelpHero({ language, onLanguageChange }: HelpHeroProps) {
  return (
    <section className="helpHero">
      <div className="container helpHeroGrid">
        <div>
          <span className="eyebrow">Talmech onboarding help</span>
          <h1>{helpText(helpPageContent.title, language)}</h1>
          <p>{helpText(helpPageContent.purpose, language)}</p>
          <div className="helpHeroActions">
            <Link className="btn" href="/signin">Start onboarding</Link>
            <Link className="btn secondary" href="/post-requirement">Post requirement</Link>
            <Link className="btn dark" href="/public-marketplace">Open marketplace</Link>
          </div>
        </div>
        <div className="helpLanguagePanel">
          <b>Language</b>
          <LanguageSwitcher value={language} onChange={onLanguageChange} />
          <p>
            Help text is stored locally in the project. Non-English drafts are practical business
            translations and are internally marked for human review.
          </p>
        </div>
      </div>
    </section>
  );
}
