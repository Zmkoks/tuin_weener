/**
 * Een plek in de tuin: een plantvak, een vrij vak of een boom/heester.
 *
 * De vormen staan in hetzelfde stelsel als de plattegrond: millimeters op A4 staand,
 * viewBox "0 0 210 297". Daarom vallen ondergrond en klikvormen zonder omrekenen over
 * elkaar heen. `label`, `badge` en `svg_label` zijn notatie voor de gedrukte kaart; op
 * het scherm laten we die niet zien.
 */
export type Vorm = {
  type: 'rect' | 'ellipse' | 'punt' | string;
  x?: number;
  y?: number;
  b?: number;
  h?: number;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
};

export type Plek = {
  id: string;
  label: string;
  soort: string;
  badge: { x: number; y: number };
  planten: string[];
  vorm: Vorm;
  svg_label: string;
};
