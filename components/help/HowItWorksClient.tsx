'use client';

import { useEffect, useState } from 'react';
import HelpHero from '@/components/help/HelpHero';
import VideoGuideCard from '@/components/help/VideoGuideCard';
import StepGuide from '@/components/help/StepGuide';
import FaqSection from '@/components/help/FaqSection';
import CommonMistakes from '@/components/help/CommonMistakes';
import {
  HelpLanguage,
  buyerSteps,
  commonMistakes,
  faqs,
  helpPageContent,
  helpText,
  isHelpLanguage,
  sellerSteps,
  traderSteps,
  videoGuides,
  videoTranscripts,
} from '@/data/helpGuides';

type HowItWorksClientProps = {
  initialLanguage: HelpLanguage;
};

export default function HowItWorksClient({ initialLanguage }: HowItWorksClientProps) {
  const [language, setLanguage] = useState<HelpLanguage>(initialLanguage);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryLanguage = params.get('lang');
      if (isHelpLanguage(queryLanguage)) {
        localStorage.setItem('talmech-help-language', queryLanguage);
        setLanguage(queryLanguage);
        return;
      }

      const stored = localStorage.getItem('talmech-help-language');
      if (isHelpLanguage(stored)) setLanguage(stored);
    } catch {}
  }, []);

  function changeLanguage(next: HelpLanguage) {
    setLanguage(next);
    try {
      localStorage.setItem('talmech-help-language', next);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', next);
      window.history.pushState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
    } catch {}
  }

  return (
    <main className="howItWorksPage">
      <HelpHero language={language} onLanguageChange={changeLanguage} />

      <section className="helpSection container">
        <div className="waHelpCallout">
          <div>
            <span className="eyebrow">Assisted upload</span>
            <h2>Need help uploading product stock or a buying requirement?</h2>
            <p className="muted">Send metal, grade, quantity, city, price and photos through WhatsApp. Talmech will review it before any marketplace conversion.</p>
          </div>
          <a className="btn" href="/whatsapp-upload">Upload via WhatsApp</a>
        </div>
      </section>

      <section className="helpSection container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Video guides</span>
            <h2 className="pageTitle">{helpText(helpPageContent.videoSectionTitle, language)}</h2>
            <p className="muted" id="video-hosting-note">
              {helpText(helpPageContent.videoHostingNote, language)}
            </p>
          </div>
        </div>
        <div className="videoGuideGrid">
          {videoGuides.map((guide) => (
            <VideoGuideCard key={guide.id} guide={guide} language={language} />
          ))}
        </div>
      </section>

      <section className="helpSection container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Operating flow</span>
            <h2 className="pageTitle">{helpText(helpPageContent.stepSectionTitle, language)}</h2>
          </div>
        </div>
        <div className="stepGuideGrid">
          <StepGuide
            eyebrow="Buyer guide"
            title={helpText(helpPageContent.buyerGuideTitle, language)}
            language={language}
            steps={buyerSteps}
          />
          <StepGuide
            eyebrow="Seller guide"
            title={helpText(helpPageContent.sellerGuideTitle, language)}
            language={language}
            steps={sellerSteps}
          />
          <StepGuide
            eyebrow="Trader guide"
            title={helpText(helpPageContent.traderGuideTitle, language)}
            language={language}
            steps={traderSteps}
          />
        </div>
      </section>

      <CommonMistakes
        language={language}
        mistakes={commonMistakes}
        title={helpText(helpPageContent.commonMistakesTitle, language)}
      />

      <section className="helpSection container">
        <div className="sectionHead">
          <div>
            <span className="eyebrow">Transcripts</span>
            <h2 className="pageTitle">{helpText(helpPageContent.transcriptSectionTitle, language)}</h2>
          </div>
        </div>
        <div className="transcriptGrid">
          {videoTranscripts.map((transcript) => (
            <article className="transcriptCard" id={`transcript-${transcript.videoId}`} key={transcript.videoId}>
              <span className="badge">Transcript</span>
              <h3>{helpText(transcript.title, language)}</h3>
              <p>{helpText(transcript.body, language)}</p>
            </article>
          ))}
        </div>
      </section>

      <FaqSection faqs={faqs} language={language} title={helpText(helpPageContent.faqTitle, language)} />
    </main>
  );
}
