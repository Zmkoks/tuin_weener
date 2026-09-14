'use client';

import { useRef, type PointerEvent, type KeyboardEvent } from 'react';
import type { Vorm } from '../data/plekTypes';
import { kader, veranderVorm, type Greep } from '../lib/plekVorm';

export type VormBewerking = { vorm: Vorm; soort: string; onVorm: (vorm: Vorm) => void; disabled?: boolean };
type Sleep = { id: number; start: { x: number; y: number }; vorm: Vorm; greep: Greep };
const namen: Record<Greep, string> = {
  verplaats: 'Plek verplaatsen', n: 'Bovenrand', ne: 'Rechterbovenhoek', e: 'Rechterrand', se: 'Rechteronderhoek',
  s: 'Onderrand', sw: 'Linkeronderhoek', w: 'Linkerrand', nw: 'Linkerbovenhoek',
};

function kaartPunt(event: PointerEvent<SVGElement>) {
  const svg = event.currentTarget.ownerSVGElement;
  const matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return null;
  const p = svg.createSVGPoint();
  p.x = event.clientX; p.y = event.clientY;
  return p.matrixTransform(matrix.inverse());
}

/** Overlay op de actuele vorm; afgebroken gestures herstellen hun eigen beginstand. */
export default function PlekVormEditor({ vorm, soort, onVorm, disabled }: VormBewerking) {
  const sleep = useRef<Sleep | null>(null);
  const k = kader(vorm);
  const rond = soort === 'bak' && vorm.type === 'ellipse';
  const posities: [Greep, number, number][] = [
    ['n', k.x + k.b / 2, k.y], ['e', k.x + k.b, k.y + k.h / 2],
    ['s', k.x + k.b / 2, k.y + k.h], ['w', k.x, k.y + k.h / 2],
    ...(!rond ? [
      ['nw', k.x, k.y], ['ne', k.x + k.b, k.y],
      ['se', k.x + k.b, k.y + k.h], ['sw', k.x, k.y + k.h],
    ] as [Greep, number, number][] : []),
  ];

  const begin = (event: PointerEvent<SVGElement>, greep: Greep) => {
    if (disabled || sleep.current || !event.isPrimary || event.button !== 0) return;
    const start = kaartPunt(event);
    if (!start) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    sleep.current = { id: event.pointerId, start, vorm, greep };
  };
  const beweeg = (event: PointerEvent<SVGElement>) => {
    const actie = sleep.current;
    if (!actie || actie.id !== event.pointerId) return;
    const p = kaartPunt(event);
    if (p) onVorm(veranderVorm(actie.vorm, soort, actie.greep, p.x - actie.start.x, p.y - actie.start.y));
  };
  const einde = (event: PointerEvent<SVGElement>, annuleren = false) => {
    const actie = sleep.current;
    if (!actie || actie.id !== event.pointerId) return;
    if (annuleren) onVorm(actie.vorm); else beweeg(event);
    sleep.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const toetsen = (event: KeyboardEvent<SVGElement>, greep: Greep) => {
    if (disabled) return;
    if (event.key === 'Escape' && sleep.current) {
      const actie = sleep.current;
      onVorm(actie.vorm); sleep.current = null;
      if (event.currentTarget.hasPointerCapture(actie.id)) event.currentTarget.releasePointerCapture(actie.id);
      event.preventDefault(); return;
    }
    if (sleep.current || !event.key.startsWith('Arrow')) return;
    const stap = event.shiftKey ? 0.1 : 1;
    const dx = event.key === 'ArrowRight' ? stap : event.key === 'ArrowLeft' ? -stap : 0;
    const dy = event.key === 'ArrowDown' ? stap : event.key === 'ArrowUp' ? -stap : 0;
    event.preventDefault(); event.stopPropagation();
    onVorm(veranderVorm(vorm, soort, greep, dx, dy));
  };
  const bediening = (greep: Greep) => ({
    tabIndex: disabled ? -1 : 0,
    role: 'button',
    'aria-label': greep === 'verplaats' ? namen[greep] : `${namen[greep]}: grootte veranderen`,
    'aria-describedby': 'vorm-bediening-uitleg',
    'aria-disabled': disabled || undefined,
    onPointerDown: (e: PointerEvent<SVGElement>) => begin(e, greep),
    onPointerMove: beweeg,
    onPointerUp: (e: PointerEvent<SVGElement>) => einde(e),
    onPointerCancel: (e: PointerEvent<SVGElement>) => einde(e, true),
    onLostPointerCapture: (e: PointerEvent<SVGElement>) => einde(e, true),
    onKeyDown: (e: KeyboardEvent<SVGElement>) => toetsen(e, greep),
  });
  return <g className="plek-vorm-editor" aria-label="Plek aanpassen">
    {vorm.type === 'rect'
      ? <rect className="plek-sleepvlak" x={k.x} y={k.y} width={k.b} height={k.h} {...bediening('verplaats')} />
      : <ellipse className="plek-sleepvlak" cx={vorm.cx} cy={vorm.cy} rx={vorm.rx} ry={vorm.ry} {...bediening('verplaats')} />}
    {posities.map(([greep, x, y]) => <g key={greep} className={`plek-handgreep greep-${greep}`} {...bediening(greep)}>
      <circle className="greep-raakvlak" cx={x} cy={y} r={1.3} />
      <circle className="greep-zichtbaar" cx={x} cy={y} r={1.3} />
    </g>)}
  </g>;
}
