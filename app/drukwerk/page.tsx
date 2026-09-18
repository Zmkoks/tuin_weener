import Kopbalk from '../components/Kopbalk';

export default function DrukwerkPagina() {
  return <main><Kopbalk actief="drukwerk"/><section className="workspace"><p className="eyebrow">DRUKWERK</p><h1>Altijd een actuele versie.</h1><p className="lead">Download documenten opnieuw wanneer een exemplaar beschadigd is of informatie is gewijzigd.</p><div className="pdf-list"><a href="/drukwerk/boekje"><span>PDF</span><div><b>Compleet plantenboekje</b><small>38 pagina’s · alle planten</small></div><strong>Printen / PDF →</strong></a><a href="/drukwerk/plattegrond"><span>PDF</span><div><b>Plattegrond met plantenindex</b><small>A4 staand · actuele versie printen</small></div><strong>Printen / PDF →</strong></a><a href="/pdf/handleiding.pdf" download><span>PDF</span><div><b>Handleiding plantenbordjes</b><small>A4, klaar om opnieuw te printen</small></div><strong>Download ↓</strong></a></div></section></main>;
}
