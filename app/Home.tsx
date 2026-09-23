'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { alleFuncties } from './data/functies';
import type { Plant } from './data/plantTypes';
import type { Plek } from './data/plekTypes';
import Kopbalk from './components/Kopbalk';
import Plattegrond from './components/Plattegrond';
import { PlantFoto } from './components/paspoortDelen';
import { photoNames } from './data/fotos';
import { icoonPad } from './data/iconen';
import { korteBotanischeNaam } from './data/tuinTekst';
import { springNaar } from './lib/springNaar';
import TakenKaart from './components/TakenKaart';
import { MAANDEN, TAAK_NAAM, takenPerPlek, takenVoor } from './lib/taken';

function Link({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return <a {...props}>{children}</a>;
}


const functionLabels: Record<string,string> = { fruit:'Fruit',kruid:'Kruiden',insecten:'Insecten',vogel:'Vogels',sier:'Sier',boom:'Bomen',onkruid:'Onkruid' };
const functions = Object.keys(functionLabels);

/**
 * De gegevens komen als props binnen, vanaf de server (`page.tsx`).
 *
 * Hiervoor begon deze pagina met `planten.json` en `tuin.json` en haalde daarna drie keer op
 * bij de API. Alles wat in de database anders stond dan in die bestanden, sprong dus zichtbaar
 * om bij elke keer laden — de foto van de aardbei was daar het duidelijkste voorbeeld van. Nu
 * staat de juiste stand er meteen. De bestanden zijn nog steeds de startvulling van de
 * database (`db/vulling.ts`), maar de pagina kijkt er niet meer naar.
 */
export default function Home({ planten, plekkenVanaf, beplanting }: { planten: Plant[]; plekkenVanaf: Plek[]; beplanting: Record<string,string[]> }){
 const[query,setQuery]=useState(''); const[filters,setFilters]=useState<string[]>([]);
 const plants=planten; const placements=beplanting; const plekken=plekkenVanaf;
 // Wie nog een adres met #aanpassen heeft, gaat door naar de beheerpagina.
 useEffect(()=>{if(window.location.hash==='#aanpassen')window.location.replace('/beheren')},[]);
 // Oude adressen uit de tijd van de tabbladen (#plattegrond, #pdfs) gaan naar hun eigen pagina.
 useEffect(()=>{const oud:Record<string,string>={plattegrond:'/plattegrond',pdfs:'/drukwerk'};const naar=oud[window.location.hash.slice(1)];if(naar)window.location.replace(naar)},[]);
 const sortedPlants=useMemo(()=>[...plants].sort((a,b)=>a.naam.localeCompare(b.naam,'nl')),[plants]);
 const filtered=useMemo(()=>sortedPlants.filter(p=>{const text=`${p.naam} ${p.botanischeNaam} ${alleFuncties(p).join(' ')}`.toLowerCase();return text.includes(query.toLowerCase())&&(filters.length===0||filters.some(f=>alleFuncties(p).includes(f))) }),[query,filters,sortedPlants]);
 const month=MAANDEN[new Date().getMonth()];
 // De taken staan in app/lib/taken.ts, want het kaartje eronder stelt dezelfde vraag.
 // Ze worden niet meer afgekapt op acht: de tegel telde dan "8 taken" terwijl het er in
 // september 23 zijn, en het kaartje ernaast zou plekken tonen die niet in de lijst staan.
 const taken=useMemo(()=>takenVoor(sortedPlants,month),[sortedPlants,month]);
 const takenOpKaart=useMemo(()=>takenPerPlek(taken,plekken,placements),[taken,plekken,placements]);
 /** De plant waar de bezoeker in de lijst boven hangt; die bak licht op de kaart mee op. */
 const[aangewezen,setAangewezen]=useState<string|null>(null);
 const heroPlanten=useMemo(()=>{const metFoto=sortedPlants.filter(p=>photoNames[p.slug]);const stap=Math.max(1,Math.floor(metFoto.length/6));return Array.from({length:Math.min(6,metFoto.length)},(_,i)=>metFoto[i*stap])},[sortedPlants]);
 const zoneNamen=useMemo(()=>Object.fromEntries(plekken.map(z=>[z.id,(placements[z.id]||z.planten).map(slug=>sortedPlants.find(p=>p.slug===slug)?.naam).filter(Boolean) as string[]])),[placements,sortedPlants,plekken]);
 const heeftWintertaken=taken.some(({soort})=>soort==='winter');
 return <main><Kopbalk actief="planten"/>

 <section className="hero"><div><p className="eyebrow">DE PLANTEN VAN WEENER XL</p><h1>Ken je<br/>planten.</h1><p className="lead">Zoek een plant op, lees hoe je hem verzorgt en zie wat er deze maand te doen is.</p><div className="hero-actions"><button onClick={()=>document.getElementById('planten')?.scrollIntoView({behavior:'smooth'})}>Zoek een plant</button><a className="button secondary" href="/plattegrond">Waar staat wat?</a></div></div><div className="hero-planten">{heroPlanten.map(p=><Link href={`/plant/${p.slug}`} key={p.slug}><PlantFoto plant={p}/><span>{p.naam}</span></Link>)}</div></section><section className="stats"><div><b>{plants.length}</b><span>plantensoorten in de tuin</span></div><div><b>{plekken.length}</b><span>plekken in de tuin</span></div><a href="#nu" aria-label={`Bekijk de ${taken.length} taken voor ${month.toLowerCase()}`} onClick={()=>springNaar(document.getElementById('nu'))}><b>{taken.length}</b><span>taken voor {month.toLowerCase()}<span className="stats-pijl" aria-hidden="true">→</span></span></a></section><section className="library" id="planten"><div className="section-head"><div><p className="eyebrow">IN DE TUIN</p><h2>Wat groeit hier?</h2></div><label className="search"><span>⌕</span><input aria-label="Zoek een plant" placeholder="Zoek op naam of soort…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><div className="filters">{functions.map(f=><button className={filters.includes(f)?'selected':''} key={f} onClick={()=>setFilters(prev=>prev.includes(f)?prev.filter(x=>x!==f):[...prev,f])}>{functionLabels[f]}</button>)}{(filters.length>0||query)&&<button className="clear" onClick={()=>{setFilters([]);setQuery('')}}>Wis filters</button>}</div><p><a href="/bibliotheek">Bekijk de volledige plantenbibliotheek, ook planten buiten de tuin →</a></p><p className="results">{filtered.length} planten gevonden</p><div className="plant-grid">{filtered.map(p=><Link className="plant-card" href={`/plant/${p.slug}`} key={p.slug}><PlantFoto plant={p}/><div><div className="tag-row">{p.functies.primair.map(f=><span className="pill" key={f}>{functionLabels[f]||f}</span>)}</div><h3>{p.naam}</h3><i>{korteBotanischeNaam(p.botanischeNaam)}</i>{p.tuinOpmerking&&<p className="kaart-tuin">{p.tuinOpmerking}</p>}<p>{p.intro}</p><span className="kaart-meer">Bekijk deze plant →</span></div></Link>)}</div></section><section className="now" id="nu"><div className="section-head"><div><p className="eyebrow">WAT KAN IK NU DOEN?</p><h2>{month}</h2></div></div>{heeftWintertaken&&<p className="winter-uitleg"><img src={icoonPad('winter')} alt=""/>In ons milde klimaat is droge grond rond de wortels vaak belangrijker dan inpakken. Doe alleen de wintertaken hieronder.</p>}<div className="nu-lay"><TakenKaart plekken={takenOpKaart} maand={month} actief={aangewezen}/><div className="task-grid">{taken.length?taken.map(({plant,soort})=><Link href={`/plant/${plant.slug}`} key={`${plant.slug}-${soort}`} onMouseEnter={()=>setAangewezen(plant.slug)} onMouseLeave={()=>setAangewezen(null)} onFocus={()=>setAangewezen(plant.slug)} onBlur={()=>setAangewezen(null)}><img src={icoonPad(soort)} alt=""/><div><b>{plant.naam}</b><small>{TAAK_NAAM[soort]}</small></div><strong aria-hidden="true">→</strong></Link>):<p>Deze maand staan er geen tuintaken in het boekje.</p>}</div></div></section><section className="tuin-blok"><div><p className="eyebrow">DE TUIN</p><h2>Waar staat welke plant?</h2><p className="lead">Op de plattegrond zie je in welke bak of op welke plek elke plant staat.</p><div className="hero-actions"><a className="button" href="/plattegrond">Bekijk de plattegrond</a></div></div><a className="map-card" href="/plattegrond" aria-label="Bekijk de plattegrond van de tuin"><Plattegrond zones={plekken} namen={zoneNamen} plants={sortedPlants} placements={placements}/><span>Ontdek waar alles groeit →</span></a></section>
 </main>
}
