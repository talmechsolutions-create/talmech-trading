import { HelpLanguage, VideoGuide, helpPageContent, helpText, supportedLanguages } from '@/data/helpGuides';

type VideoGuideCardProps = {
  guide: VideoGuide;
  language: HelpLanguage;
};

export default function VideoGuideCard({ guide, language }: VideoGuideCardProps) {
  const videoUrl = guide.videoEmbedUrls[language] || guide.videoEmbedUrls.en;
  const available = supportedLanguages
    .filter((item) => guide.languageAvailability.includes(item.code))
    .map((item) => item.shortLabel)
    .join(', ');

  return (
    <article className="videoGuideCard">
      <div className="videoPlaceholder" aria-label={`${helpText(guide.title, language)} video placeholder`}>
        <span>Screen recording</span>
        <b>{helpText(guide.title, language)}</b>
      </div>
      <div className="videoGuideBody">
        <div className="videoMetaRow">
          <span>{guide.duration}</span>
          <span>{guide.captionsAvailable ? 'Captions available' : 'Captions pending'}</span>
        </div>
        <h3>{helpText(guide.title, language)}</h3>
        <p className="muted">{helpText(guide.description, language)}</p>
        <dl>
          <div>
            <dt>Audience</dt>
            <dd>{helpText(guide.audience, language)}</dd>
          </div>
          <div>
            <dt>Languages</dt>
            <dd>{available}</dd>
          </div>
        </dl>
        {!videoUrl && <p className="videoComingSoon">{helpText(helpPageContent.videoComingSoon, language)}</p>}
        <div className="videoGuideActions">
          <a className="btn" href={videoUrl || '#video-hosting-note'}>
            Watch Guide
          </a>
          <a className="btn secondary" href={`#transcript-${guide.transcriptId}`}>
            Read Transcript
          </a>
        </div>
      </div>
    </article>
  );
}
