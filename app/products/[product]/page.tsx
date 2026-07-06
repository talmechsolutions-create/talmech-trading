import type { Metadata } from 'next';
import Link from 'next/link';
import { productCategories } from '@/lib/marketplaceData';
import { metalProducts } from '@/lib/metalProducts';
import { getProductImage, productSlug } from '@/lib/productImages';
import ProductMarketIntelligence from '@/components/ProductMarketIntelligence';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://talmech-trading.vercel.app';

type ProductPageProps = { params: { product: string }; searchParams: { metal?: string; product?: string } };

const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const titleCase = (value: string) => value.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.slice(1));

function resolveProduct(params: ProductPageProps['params'], searchParams: ProductPageProps['searchParams']) {
  const productName = searchParams.product || decodeURIComponent(params.product || '').replaceAll('-', ' ');
  const normalized = clean(productName);
  const productInfo = metalProducts.find(p => clean(p.product) === normalized) || metalProducts.find(p => normalized.includes(clean(p.product)) || clean(p.product).includes(normalized));
  const category = productCategories.find(m => m.slug === searchParams.metal)
    || productCategories.find(m => productInfo?.metalSlug === m.slug)
    || productCategories.find(m => m.products.some(p => clean(p) === normalized || normalized.includes(clean(p))))
    || productCategories[0];
  return { productName: titleCase(productName), category, productInfo };
}

export function generateMetadata({ params, searchParams }: ProductPageProps): Metadata {
  const { productName, category, productInfo } = resolveProduct(params, searchParams);
  const image = getProductImage(productName, category.slug);
  const description = `${productName} sourcing page for ${category.metal}: grades, buyer industries, supplier routes, quality checks, live marketplace intelligence and verified buying/selling actions across India.`;
  const canonicalPath = `/products/${productSlug(productName)}?metal=${category.slug}&product=${encodeURIComponent(productName)}`;
  return {
    title: `${productName} suppliers, buyers, grades and monthly market intelligence`,
    description,
    keywords: [
      productName,
      `${productName} supplier India`,
      `${productName} buyer India`,
      `${productName} marketplace`,
      `${category.metal} supplier`,
      ...(productInfo?.searchTerms || category.seoKeywords || [])
    ],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${productName} marketplace intelligence | Talmech Trading`,
      description,
      type: 'article',
      url: `${siteUrl}${canonicalPath}`,
      images: [{ url: image, width: 1200, height: 800, alt: `${productName} supplier and buyer marketplace` }]
    },
    twitter: { card: 'summary_large_image', title: `${productName} marketplace intelligence`, description, images: [image] }
  };
}

function InfoList({ items, icon }: { items: string[]; icon?: string }) {
  return <ul className="productProList">{items.map(item => <li key={item}><span>{icon || '•'}</span>{item}</li>)}</ul>;
}

export default function ProductPage({ params, searchParams }: ProductPageProps) {
  const { productName, category, productInfo } = resolveProduct(params, searchParams);
  const img = getProductImage(productName, category.slug);
  const grades = productInfo?.commonGrades?.length ? productInfo.commonGrades : category.grades;
  const uses = productInfo?.primaryUses?.length ? productInfo.primaryUses : category.buyerIndustries;
  const buyers = productInfo?.buyerIndustries?.length ? productInfo.buyerIndustries : category.buyerIndustries;
  const checks = productInfo?.qualityChecks?.length ? productInfo.qualityChecks : category.qualityChecks;
  const suppliers = category.supplierTypes;
  const forms = productInfo?.forms?.length ? productInfo.forms : category.products.slice(0, 6);
  const pricingNote = productInfo?.pricingNote || 'Final rate depends on grade, quantity, location, stock readiness and verified supplier quote.';
  const unit = productInfo?.unit || 'MT';
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    category: `${category.metal} industrial product`,
    image: `${siteUrl}${img}`,
    description: `${productName} sourcing, supplier, buyer, grade and quality-check guide by Talmech Trading.`,
    brand: { '@type': 'Brand', name: 'Talmech Trading' },
    areaServed: 'India',
    offers: { '@type': 'AggregateOffer', priceCurrency: 'INR', availability: 'https://schema.org/InStock', offerCount: 1 }
  };

  return (
    <main className="productProPage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

      <section className="productProHero">
        <div className="container productProHeroGrid">
          <div className="productProCopy">
            <span className="eyebrow">Verified product intelligence</span>
            <h1>{productName} sourcing, supplier discovery and buyer-market actions.</h1>
            <p>
              A practical marketplace page for {category.metal.toLowerCase()} buyers, sellers and traders. Review grades, applications,
              supplier routes, quality checks, monthly regional signals and the correct next action before routing a verified deal.
            </p>
            <div className="productProActions">
              <Link className="btn" href={`/public-marketplace?product=${encodeURIComponent(productName)}&metal=${category.slug}`}>Search live marketplace</Link>
              <Link className="btn secondary" href={`/post-requirement?metal=${category.slug}&product=${encodeURIComponent(productName)}`}>Post verified requirement</Link>
              <Link className="productGhostLink" href={`/sell?metal=${category.slug}&product=${encodeURIComponent(productName)}`}>List supply</Link>
            </div>
            <div className="productProStats" aria-label="Product sourcing summary">
              <span><b>{category.metal}</b><small>metal category</small></span>
              <span><b>{unit}</b><small>normal trade unit</small></span>
              <span><b>{grades[0] || 'Grade based'}</b><small>common grade</small></span>
            </div>
          </div>
          <div className="productProVisual">
            <img src={img} alt={`${productName} supplier sourcing reference`} />
            <div className="productProVisualOverlay">
              <span>{category.metal}</span>
              <b>{productName}</b>
              <small>Verified stock • quote • logistics workflow</small>
            </div>
          </div>
        </div>
      </section>

      <section className="productProSection productProIntroSection">
        <div className="container productProIntroGrid">
          <article className="productProPanel productProOverview">
            <span className="productPanelKicker">Product snapshot</span>
            <h2>What Talmech checks before routing {productName} leads</h2>
            <p>
              Each listing or requirement should carry clear commercial and technical signals: exact grade, size, condition, available quantity,
              dispatch readiness, GST billing route, buyer/seller location and whether Talmech logistics is required.
            </p>
            <div className="productMiniGrid">
              {forms.slice(0, 6).map(form => <span key={form}>{form}</span>)}
            </div>
          </article>
          <article className="productProPanel pricePanel">
            <span className="productPanelKicker">Pricing logic</span>
            <h2>Quote method</h2>
            <p>{pricingNote}</p>
            <div className="priceSignalBox">
              <b>{productInfo?.priceStatus === 'api-live' ? 'API base + local premium' : productInfo?.priceStatus === 'manual-market' ? 'Manual market quote' : 'Supplier quote verification'}</b>
              <small>Final payable value should be confirmed after GST, logistics route, service charge and seller documentation checks.</small>
            </div>
          </article>
        </div>
      </section>

      <ProductMarketIntelligence product={productName} metal={category.slug} />

      <section className="productProSection">
        <div className="container productProContentGrid">
          <article className="productProPanel imagePanel">
            <img src={img} alt={`${productName} reference stock`} />
            <div>
              <span className="productPanelKicker">Reference overview</span>
              <h2>How this product should be listed</h2>
              <p>Use real stock photos, gate/stockyard pickup pin, dispatch status, inspection documents and complete grade/size details. This avoids wrong leads and improves logistics accuracy.</p>
            </div>
          </article>

          <article className="productProPanel"><span className="productPanelKicker">Grade matrix</span><h2>Common grades</h2><InfoList items={grades} /></article>
          <article className="productProPanel"><span className="productPanelKicker">Buyer use cases</span><h2>Where buyers use it</h2><InfoList items={uses} /></article>
          <article className="productProPanel"><span className="productPanelKicker">Supplier routes</span><h2>Likely supplier sources</h2><InfoList items={suppliers} /></article>
          <article className="productProPanel"><span className="productPanelKicker">Quality control</span><h2>Checks before deal</h2><InfoList items={checks} icon="✓" /></article>
          <article className="productProPanel"><span className="productPanelKicker">Target buyers</span><h2>Buyer industries</h2><InfoList items={buyers} /></article>
        </div>
      </section>

      <section className="productProCTASection">
        <div className="container productProCTA">
          <div>
            <span className="eyebrow">Next verified action</span>
            <h2>Route {productName} through Talmech’s buyer, seller and logistics workflow.</h2>
            <p>Post complete details once. Talmech can use the same information for marketplace search, GST-aware price-lock, supplier matching, document review and logistics calculation.</p>
          </div>
          <div className="productProCTAActions">
            <Link className="btn" href={`/post-requirement?metal=${category.slug}&product=${encodeURIComponent(productName)}`}>Post buy requirement</Link>
            <Link className="btn secondary" href={`/sell?metal=${category.slug}&product=${encodeURIComponent(productName)}`}>List supply</Link>
            <Link className="btn dark" href={`/public-marketplace?product=${encodeURIComponent(productName)}&metal=${category.slug}`}>Browse matches</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
