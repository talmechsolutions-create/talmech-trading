import Link from 'next/link';
import RequirementForm from '@/components/RequirementForm';
import ContextualHelpBox from '@/components/help/ContextualHelpBox';

export const metadata = { title:'Sell Metal on Talmech Trading', description:'List steel, scrap, forgings, copper, aluminum, brass and industrial stock for buyers across India.' };

export default function Sell(){
  return (
    <main>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Supplier onboarding</span>
          <h1 className="h1">Sell metal, scrap, stock and components through Talmech.</h1>
          <p className="lead">Manufacturers, stockists, scrap dealers, fabricators and component suppliers can post stock with grade, size, quantity, location and dispatch readiness.</p>
          <div className="heroActionRow">
            <Link className="btn" href="/whatsapp-upload">Need help uploading?</Link>
            <Link className="btn secondary" href="/how-it-works">How it works</Link>
            <Link className="btn dark" href="/how-it-works#transcript-seller-onboarding">Seller guide</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ContextualHelpBox type="sellerOnboarding" label="Need help onboarding?" />
          <RequirementForm initialIntent="SELL"/>
        </div>
      </section>
    </main>
  );
}
