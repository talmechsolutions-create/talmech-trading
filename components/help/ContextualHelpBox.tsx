'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HelpLanguage,
  contextualHelp,
  helpText,
  isHelpLanguage,
} from '@/data/helpGuides';

type ContextualHelpBoxProps = {
  type: keyof typeof contextualHelp;
  label?: string;
  className?: string;
};

export default function ContextualHelpBox({ type, label = 'How it works', className = '' }: ContextualHelpBoxProps) {
  const [language, setLanguage] = useState<HelpLanguage>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('talmech-help-language');
      if (isHelpLanguage(stored)) setLanguage(stored);
    } catch {}
  }, []);

  return (
    <div className={`contextHelpBox ${className}`}>
      <p>{helpText(contextualHelp[type], language)}</p>
      <Link className="btn secondary" href={`/how-it-works?lang=${language}`}>
        {label}
      </Link>
    </div>
  );
}
