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

type Tab = 'overzicht' | 'plattegrond' | 'pdfs';

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
 const[tab,setTab]=useState<Tab>('overzicht'); const[query,setQuery]=useState(''); const[filters,setFilters]=useState<string[]>([]); const[zoneId,setZoneId]=useState('');
 const plants=planten; const placements=beplanting; const plekken=plekkenVanaf;
 // Wie nog een adres met #aanpassen heeft, gaat door naar de beheerpagina.
 useEffect(()=>{if(window.location.hash==='#aanpassen')window.location.replace('/beheren')},[]);
 useEffect(()=>{const leesAdres=()=>{const uitAdres=window.location.hash.slice(1);setTab((['plattegrond','pdfs'] as string[]).includes(uitAdres)?uitAdres as Tab:'overzicht')};leesAdres();window.addEventListener('hashchange',leesAdres);window.addEventListener('popstate',leesAdres);return()=>{window.removeEventListener('hashchange',leesAdres);window.removeEventListener('popstate',leesAdres)}},[]);
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
 const zone=plekken.find(z=>z.id===zoneId); const zonePlants=zone?(placements[zone.id]||zone.planten).map(slug=>sortedPlants.find(p=>p.slug===slug)).filter(Boolean) as Plant[]:[];
 const zoneNamen=useMemo(()=>Object.fromEntries(plekken.map(z=>[z.id,(placements[z.id]||z.planten).map(slug=>sortedPlants.find(p=>p.slug===slug)?.naam).filter(Boolean) as string[]])),[placements,sortedPlants,plekken]);
 const go=(next:Tab)=>{setTab(next);window.history.pushState(null,'',next==='overzicht'?window.location.pathname:`#${next}`);window.scrollTo({top:0,behavior:'smooth'})};
 return <main><Kopbalk actief={tab==='plattegrond'?'plattegrond':tab==='pdfs'?'drukwerk':'planten'}/>

 {tab==='overzicht'&&<><section className="hero"><div><p className="eyebrow">DE PLANTEN VAN WEENER XL</p><h1>Ken je<br/>planten.</h1><p className="lead">Zoek een plant op, lees hoe je hem verzorgt en zie wat er deze maand te doen is.</p><div className="hero-actions"><button onClick={()=>document.getElementById('planten')?.scrollIntoView({behavior:'smooth'})}>Zoek een plant</button><button className="secondary" onClick={()=>go('plattegrond')}>Waar staat wat?</button></div></div><div className="hero-planten">{heroPlanten.map(p=><Link href={`/plant/${p.slug}`} key={p.slug}><PlantFoto plant={p}/><span>{p.naam}</span></Link>)}</div></section><section className="stats"><div><b>{plants.length}</b><span>plantensoorten in de tuin</span></div><div><b>{plekken.length}</b><span>plekken in de tuin</span></div><a href="#nu" aria-label={`Bekijk de ${taken.length} taken voor ${month.toLowerCase()}`} onClick={()=>springNaar(document.getElementById('nu'))}><b>{taken.length}</b><span>taken voor {month.toLowerCase()}<span className="stats-pijl" aria-hidden="true">→</span></span></a></section><section className="library" id="planten"><div className="section-head"><div><p className="eyebrow">IN DE TUIN</p><h2>Wat groeit hier?</h2></div><label className="search"><span>⌕</span><input aria-label="Zoek een plant" placeholder="Zoek op naam of soort…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><div className="filters">{functions.map(f=><button className={filters.includes(f)?'selected':''} key={f} onClick={()=>setFilters(prev=>prev.includes(f)?prev.filter(x=>x!==f):[...prev,f])}>{functionLabels[f]}</button>)}{(filters.length>0||query)&&<button className="clear" onClick={()=>{setFilters([]);setQuery('')}}>Wis filters</button>}</div><p><a href="/bibliotheek">Bekijk de volledige plantenbibliotheek, ook planten buiten de tuin →</a></p><p className="results">{filtered.length} planten gevonden</p><div className="plant-grid">{filtered.map(p=><Link className="plant-card" href={`/plant/${p.slug}`} key={p.slug}><PlantFoto plant={p}/><div><div className="tag-row">{p.functies.primair.map(f=><span className="pill" key={f}>{functionLabels[f]||f}</span>)}</div><h3>{p.naam}</h3><i>{korteBotanischeNaam(p.botanischeNaam)}</i><p>{p.intro}</p><span className="kaart-meer">Bekijk deze plant →</span></div></Link>)}</div></section><section className="now" id="nu"><div className="section-head"><div><p className="eyebrow">WAT KAN IK NU DOEN?</p><h2>{month}</h2></div></div><div className="nu-lay"><TakenKaart plekken={takenOpKaart} maand={month} actief={aangewezen}/><div className="task-grid">{taken.length?taken.map(({plant,soort})=><Link href={`/plant/${plant.slug}`} key={`${plant.slug}-${soort}`} onMouseEnter={()=>setAangewezen(plant.slug)} onMouseLeave={()=>setAangewezen(null)} onFocus={()=>setAangewezen(plant.slug)} onBlur={()=>setAangewezen(null)}><img src={icoonPad(soort)} alt=""/><div><b>{plant.naam}</b><small>{TAAK_NAAM[soort]}</small></div><strong aria-hidden="true">→</strong></Link>):<p>Deze maand staan er geen oogst- of snoeitaken in het boekje.</p>}</div></div></section><section className="tuin-blok"><div><p className="eyebrow">DE TUIN</p><h2>Waar staat welke plant?</h2><p className="lead">Op de plattegrond zie je in welke bak of op welke plek elke plant staat.</p><div className="hero-actions"><button onClick={()=>go('plattegrond')}>Bekijk de plattegrond</button></div></div><button className="map-card" onClick={()=>go('plattegrond')} aria-label="Bekijk de plattegrond van de tuin"><Plattegrond zones={plekken} namen={zoneNamen} plants={sortedPlants} placements={placements}/><span>Ontdek waar alles groeit →</span></button></section></>}

 {tab==='plattegrond'&&<section className="workspace map-workspace"><p className="eyebrow">INTERACTIEVE PLATTEGROND</p><h1>Waar groeit wat?</h1><p className="lead">Klik op een plantvak, een boom of een heester en bekijk welke planten daar staan.</p><div className="map-layout"><div className="large-map"><Plattegrond zones={plekken} gekozen={zoneId} onKies={setZoneId} namen={zoneNamen} plants={plants} placements={placements}/></div><aside><div className="zone-result">{zone?<><h2>Wat groeit hier?</h2><p>{zonePlants.length} {zonePlants.length===1?'plant':'planten'} op deze plek</p>{zonePlants.map(p=><Link className="zone-plant" href={`/plant/${p.slug}`} key={p.slug}><PlantFoto plant={p}/><span><b>{p.naam}</b></span><strong aria-hidden="true">→</strong></Link>)}</>:<><h2>Kies een plek</h2><p>Klik op de kaart op een vak, boom of heester om te zien wat daar groeit.</p></>}</div></aside></div></section>}

 {tab==='pdfs'&&<section className="workspace"><p className="eyebrow">DRUKWERK</p><h1>Altijd een actuele versie.</h1><p className="lead">Download documenten opnieuw wanneer een exemplaar beschadigd is of informatie is gewijzigd.</p><div className="pdf-list"><a href="/pdf/plantenboekje.pdf" download><span>PDF</span><div><b>Compleet plantenboekje</b><small>38 pagina’s · alle planten</small></div><strong>Download ↓</strong></a><a href="/drukwerk/plattegrond"><span>PDF</span><div><b>Plattegrond met plantenindex</b><small>A4 staand · actuele versie printen</small></div><strong>Printen / PDF →</strong></a><a href="/pdf/handleiding.pdf" download><span>PDF</span><div><b>Handleiding plantenbordjes</b><small>A4, klaar om opnieuw te printen</small></div><strong>Download ↓</strong></a></div><div className="notice"><b>Nieuwe informatie toegevoegd?</b><p>Na het opslaan kan hier automatisch een nieuwe drukversie worden klaargezet.</p><button>Nieuwe PDF’s maken</button></div></section>}
 </main>
}
