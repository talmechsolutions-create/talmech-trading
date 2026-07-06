import Link from 'next/link';
import { productCategories } from '@/lib/marketplaceData';

export const metadata={title:'Metal Categories India',description:'Explore steel, copper, aluminum, brass, zinc, nickel, lead, forgings and aerospace components on Talmech Trading with product forms, grades and buyer guidance.'};

function imagePath(slug:string){return `/images/metal-categories/${slug}.webp`}

export default function Metals(){
  return <main>
    <section className="categoryHero refinedCategoryHero">
      <div className="container categoryHeroInner">
        <div>
          <span className="eyebrow">Metal categories</span>
          <h1 className="h1">Choose a metal category, review products and move directly to market-ready detail pages.</h1>
          <p className="lead">Each category now includes a professional product image, common product forms, grades, buyer industries, supplier sources and quality checkpoints.</p>
          <div className="row" style={{justifyContent:'flex-start',marginTop:22}}>
            <Link className="btn" href="/public-marketplace">Browse marketplace</Link>
            <Link className="btn secondary" href="/post-requirement">Post requirement</Link>
          </div>
        </div>
        <div className="categoryHeroCard cleanCategoryHeroCard">
          <b>Built for practical trading</b>
          <ul className="cleanBulletList">
            <li>Understand product forms before posting enquiries.</li>
            <li>Use grade and quality guidance to reduce mismatched leads.</li>
            <li>Open a product page and move directly to marketplace action.</li>
            <li>Keep buyer and seller communication structured.</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="grid categoryCardGrid">
          {productCategories.map((m)=><Link className="categoryCardPro refinedCategoryCard imageCategoryCard" href={`/metals/${m.slug}`} key={m.slug}>
            <div className="categoryVisual imageBackedVisual" style={{backgroundImage:`linear-gradient(180deg,rgba(2,6,23,.04),rgba(2,6,23,.62)), url(${imagePath(m.slug)})`}}>
              <span>{m.metal}</span>
            </div>
            <div className="categoryContent">
              <h2>{m.metal}</h2>
              <p>{m.products.slice(0,6).join(', ')}</p>
              <div className="listingMeta">{m.grades.slice(0,4).map(g=><span className="pill" key={g}>{g}</span>)}</div>
              <b>Explore {m.metal} details →</b>
            </div>
          </Link>)}
        </div>
      </div>
    </section>
  </main>
}
