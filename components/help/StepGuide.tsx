import { HelpLanguage, LocalizedText, helpText } from '@/data/helpGuides';

type StepGuideProps = {
  eyebrow: string;
  title: string;
  language: HelpLanguage;
  steps: LocalizedText[];
};

export default function StepGuide({ eyebrow, title, language, steps }: StepGuideProps) {
  return (
    <article className="stepGuide">
      <span className="eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      <ol>
        {steps.map((step, index) => (
          <li key={`${title}-${index}`}>
            <span>{index + 1}</span>
            <p>{helpText(step, language)}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
