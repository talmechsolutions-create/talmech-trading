import { FaqItem, HelpLanguage, helpText } from '@/data/helpGuides';

type FaqSectionProps = {
  faqs: FaqItem[];
  language: HelpLanguage;
  title: string;
};

export default function FaqSection({ faqs, language, title }: FaqSectionProps) {
  return (
    <section className="helpSection">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 className="pageTitle">{title}</h2>
        </div>
      </div>
      <div className="faqGrid">
        {faqs.map((item) => (
          <details className="faqItem" key={helpText(item.question, 'en')}>
            <summary>{helpText(item.question, language)}</summary>
            <p>{helpText(item.answer, language)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
