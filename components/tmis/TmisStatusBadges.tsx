type TmisStatusBadgesProps = {
  contentStatus?: string;
  verificationStatus?: string;
  confidenceLevel?: string;
};

export default function TmisStatusBadges({ contentStatus, verificationStatus, confidenceLevel }: TmisStatusBadgesProps) {
  return (
    <div className="listingMeta tmisStatusBadges" aria-label="TMIS review status">
      {contentStatus && <span className="pill gold tmisBadge tmisBadgeDraft">{contentStatus}</span>}
      {verificationStatus && <span className="pill tmisBadge tmisBadgeReview">{verificationStatus}</span>}
      {confidenceLevel && <span className="pill green tmisBadge tmisBadgeConfidence">{confidenceLevel} confidence</span>}
    </div>
  );
}
