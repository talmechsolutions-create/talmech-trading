import type { Metadata } from 'next';
import Link from 'next/link';
import WhatsappUploadForm from '@/components/WhatsappUploadForm';

export const metadata: Metadata = {
  title: 'Upload Products via WhatsApp | Talmech Trading',
  description: 'Send metal product details, prices, quantities, location, and photos through WhatsApp for Talmech admin-assisted upload.',
  alternates: { canonical: '/whatsapp-upload' },
};

const steps = [
  'Select your role',
  'Select what you want to submit',
  'Select metal, product, grade, and form',
  'Fill simple details',
  'Send on WhatsApp or submit for admin review',
  'Attach photos/documents in WhatsApp chat',
];

export default function WhatsappUploadPage() {
  return (
    <main className="waUploadPage">
      <section className="waHero section">
        <div className="container waHeroGrid">
          <div>
            <span className="eyebrow">WhatsApp Assisted Upload</span>
            <h1 className="pageTitle">Upload Product or Requirement Through WhatsApp</h1>
            <p className="lead">Send your metal product, price, quantity, location, and photos on WhatsApp. Talmech will review and help upload it properly.</p>
            <p className="waTrustNote">No login required. Send details directly on WhatsApp. Talmech reviews every submission before publishing. Final listing, price, and availability depend on verification and admin approval.</p>
            <div className="heroActionRow">
              <a className="btn" href="#whatsapp-upload-form">Start upload</a>
              <Link className="btn secondary" href="/post-requirement">Post standard requirement</Link>
            </div>
          </div>
          <div className="waHeroPanel">
            <b>Phase 1 workflow</b>
            <span>wa.me message</span>
            <span>Admin review queue</span>
            <span>Manual listing / RFQ conversion</span>
            <small>No WhatsApp API secrets or media uploads are stored in code.</small>
          </div>
        </div>
      </section>

      <section className="section waFlowSection">
        <div className="container">
          <div className="waFlowGrid">
            {steps.map((step, index) => (
              <article className="waFlowItem" key={step}>
                <span>{index + 1}</span>
                <b>{step}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="whatsapp-upload-form">
        <div className="container">
          <WhatsappUploadForm />
        </div>
      </section>
    </main>
  );
}
