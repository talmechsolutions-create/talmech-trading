import { HelpLanguage, LocalizedText, helpText } from '@/data/helpGuides';

type CommonMistakesProps = {
  language: HelpLanguage;
  mistakes: LocalizedText[];
  title: string;
};

export default function CommonMistakes({ language, mistakes, title }: CommonMistakesProps) {
  return (
    <section className="helpSection">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">Avoid delays</span>
          <h2 className="pageTitle">{title}</h2>
        </div>
      </div>
      <div className="mistakeGrid">
        {mistakes.map((item, index) => (
          <article key={`${helpText(item, 'en')}-${index}`}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <p>{helpText(item, language)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
