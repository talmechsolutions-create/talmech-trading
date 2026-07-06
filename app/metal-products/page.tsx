import Link from 'next/link';
import { productCategories } from '@/lib/marketplaceData';

export const metadata={
  title:'Metal Products, Grades and Uses | Talmech Trading',
  description:'Explore metal product categories, common grades, buyer industries and quality checks for steel, copper, aluminum, brass, forgings, scrap and precision components in India.'
};

function imagePath(slug:string){return `/images/metal-categories/${slug}.webp`}
function productSlug(p:string){return encodeURIComponent(p.toLowerCase().replaceAll(' ','-').replaceAll('/','-'))}

export default function Products(){
  return <main>
    <section className="productHubHero">
      <div className="container productHubHeroGrid">
        <div>
          <span className="eyebrow">Metal product knowledge hub</span>
          <h1 className="pageTitle">Find the right product form, grade and buyer category before opening a deal.</h1>
          <p className="lead darkLead">Talmech Trading organises metal products in a practical trading format: product form, common grade, likely buyer, supplier source, quality checks and marketplace action.</p>
          <div className="row" style={{justifyContent:'flex-start',marginTop:22}}>
            <Link className="btn" href="/public-marketplace">Search marketplace</Link>
            <Link className="btn secondary" href="/post-requirement">Post requirement</Link>
          </div>
        </div>
        <div className="productHubTrustCard">
          <b>How to use this page</b>
          <p>Select a category, review product forms, then open a detail page to post a cleaner buy/sell requirement with images and documents.</p>
          <div className="trustMiniGrid">
            <span>Grade clarity</span><span>Buyer mapping</span><span>Supplier sources</span><span>Quality checks</span>
          </div>
        </div>
      </div>
    </section>

    <section className="section productHubSection">
      <div className="container productHubGrid">
        {productCategories.map((m)=><article className="productHubCard" key={m.slug}>
          <div className="productHubImage" style={{backgroundImage:`linear-gradient(180deg,rgba(2,6,23,.05),rgba(2,6,23,.62)), url(${imagePath(m.slug)})`}}>
            <span>{m.metal}</span>
          </div>
          <div className="productHubBody">
            <div className="productHubTopline">
              <h2>{m.metal}</h2>
              <Link className="btn tinyBtn secondary" href={`/metals/${m.slug}`}>Detail page</Link>
            </div>
            <p className="muted">{m.products.slice(0,5).join(', ')}{m.products.length>5?' and more.':''}</p>
            <div className="productChipCloud">
              {m.products.slice(0,8).map(p=><Link key={p} href={`/products/${productSlug(p)}?metal=${m.slug}&product=${encodeURIComponent(p)}`}>{p}</Link>)}
            </div>
            <div className="productHubInfoGrid">
              <div><b>Common grades</b><p>{m.grades.slice(0,7).join(', ')}</p></div>
              <div><b>Buyer industries</b><p>{m.buyerIndustries.slice(0,5).join(', ')}</p></div>
              <div><b>Quality focus</b><p>{m.qualityChecks.slice(0,5).join(', ')}</p></div>
            </div>
          </div>
        </article>)}
      </div>
    </section>
  </main>
}
