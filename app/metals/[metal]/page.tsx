import type { Metadata } from 'next';
import Link from 'next/link';
import { productCategories } from '@/lib/marketplaceData';
import { getMetalImage, getProductImage, productSlug } from '@/lib/productImages';

export async function generateStaticParams(){return productCategories.map(m=>({metal:m.slug}))}
export async function generateMetadata({params}:{params:{metal:string}}): Promise<Metadata>{
  const m=productCategories.find(x=>x.slug===params.metal);
  return {
    title:m?`${m.metal} Suppliers, Products, Grades and Buyer Uses`:'Metal Detail',
    description:m?`Explore ${m.metal} product forms, common grades, supplier sources, buyer industries and quality checks on Talmech Trading India.`:'Talmech metal detail',
    alternates: { canonical: `/metals/${params.metal}` },
    openGraph: m ? { title: `${m.metal} Products and Suppliers`, description: `Find ${m.metal} products, grades and marketplace actions.`, images: [{ url: getMetalImage(m.slug), width: 1200, height: 800, alt: `${m.metal} products` }] } : undefined
  };
}
function slugify(p:string){return productSlug(p)}

export default function MetalPage({params}:{params:{metal:string}}){
  const m=productCategories.find(x=>x.slug===params.metal)||productCategories[0];
  return <main>
    <section className="metalDetailHero refinedMetalHero proMetalHero">
      <div className="container metalDetailGrid">
        <div>
          <span className="eyebrow">{m.metal} trading guide</span>
          <h1 className="pageTitle">{m.metal}: product forms, grades, buyer industries and sourcing guidance.</h1>
          <p className="muted">Understand common product names, grade options, buyer categories, supplier sources and quality checks before posting or accepting a marketplace deal.</p>
          <div className="row" style={{justifyContent:'flex-start',marginTop:18}}>
            <Link className="btn" href={`/post-requirement?metal=${m.slug}`}>Post {m.metal} requirement</Link>
            <Link className="btn secondary" href={`/public-marketplace?metal=${m.slug}`}>Browse {m.metal} listings</Link>
          </div>
        </div>
        <div className="metalHeroImage imageMetalHero proHeroImage" style={{backgroundImage:`linear-gradient(180deg,rgba(2,6,23,.03),rgba(2,6,23,.68)), url(${getMetalImage(m.slug)})`}}>
          <span>{m.metal}</span>
          <small>{m.products.slice(0,4).join(' • ')}</small>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container metalInfoLayout refinedMetalLayout">
        <article className="card productFormsPanel cleanerPanel">
          <div className="sectionHeadMini">
            <div>
              <h2>Product forms</h2>
              <p className="muted">Each card opens a product guide with a dedicated product image, market actions, grades and verification guidance.</p>
            </div>
          </div>
          <div className="productFormGrid cleanerProductFormGrid">
            {m.products.map((p)=><Link className="productFormCard cleanerProductCard productImageCard" href={`/products/${slugify(p)}?metal=${m.slug}&product=${encodeURIComponent(p)}`} key={p}>
              <img src={getProductImage(p,m.slug)} alt={`${p} ${m.metal} product`} />
              <b>{p}</b>
              <small>Product guide, supplier route and marketplace actions</small>
            </Link>)}
          </div>
        </article>
        <aside className="metalSideStack">
          <article className="card cleanerPanel"><h2>Common grades</h2><div className="listingMeta">{m.grades.map(p=><span className="pill green" key={p}>{p}</span>)}</div></article>
          <article className="card cleanerPanel"><h2>Quality checklist</h2>{m.qualityChecks.map(x=><p key={x}>✅ {x}</p>)}</article>
        </aside>
        <article className="card cleanerPanel"><h2>Buyer industries</h2>{m.buyerIndustries.map(x=><p key={x}>• {x}</p>)}</article>
        <article className="card cleanerPanel"><h2>Supplier sources</h2>{m.supplierTypes.map(x=><p key={x}>• {x}</p>)}</article>
        <article className="card cleanerPanel"><h2>Search guidance</h2>{m.seoKeywords.map(x=><p key={x}>🔎 {x}</p>)}<Link className="btn secondary" href={`/public-marketplace?metal=${m.slug}`}>Search marketplace</Link></article>
      </div>
    </section>
  </main>
}
