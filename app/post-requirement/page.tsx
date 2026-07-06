import Link from 'next/link';
import RequirementForm from '@/components/RequirementForm';
import ContextualHelpBox from '@/components/help/ContextualHelpBox';

export const metadata = { title:'Post Metal Requirement', description:'Post steel, scrap, copper, aluminum, brass, forging or precision component requirements on Talmech Trading.' };

export default function Page(){
  return (
    <main>
      <section className="productHero section">
        <div className="container">
          <span className="eyebrow">Buyer / supplier / scrap / logistics funnel</span>
          <h1 className="pageTitle">Post your metal requirement or offer.</h1>
          <p className="muted">Talmech team reviews, verifies and connects you with suitable local or all-India partners.</p>
          <div className="heroActionRow">
            <Link className="btn" href="/whatsapp-upload">Post requirement via WhatsApp</Link>
            <Link className="btn secondary" href="/how-it-works">How it works</Link>
            <Link className="btn dark" href="/how-it-works#transcript-buyer-onboarding">Buyer guide</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ContextualHelpBox type="postRequirement" label="Watch onboarding guide" />
          <RequirementForm/>
        </div>
      </section>
    </main>
  );
}
