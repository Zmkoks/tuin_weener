'use client';

export default function PrintKnop() {
  return <button type="button" className="print-knop" onClick={() => window.print()}>
    Afdrukken / PDF opslaan
  </button>;
}
