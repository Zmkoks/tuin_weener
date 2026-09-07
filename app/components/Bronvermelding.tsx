/** Credits blijven tekst; alleen expliciete http(s)-adressen worden links. */
export function Bronvermelding({ label, bron }: { label: string; bron?: string }) {
  if (!bron) return null;
  const delen = bron.split(/(https?:\/\/[^\s<>"()]+)/g);
  return <p><strong>{label}: </strong>{delen.map((deel, i) => /^https?:\/\//.test(deel)
    ? <a key={i} href={deel} target="_blank" rel="noreferrer">{deel}</a>
    : deel)}</p>;
}
