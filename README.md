# Tuin Weener XL

## Bekijk de site

**[Open de live site van Tuin Weener XL →](https://weener-xl-tuin.spamivia.chatgpt.site/)**

Deze website helpt bezoekers de planten in de tuin van Weener XL te herkennen en te
verzorgen. De site is gemaakt voor **Aan de Slag van Weener XL**.

Op de site kun je onder andere:

- planten zoeken en hun verzorging lezen;
- zien wat er deze maand in de tuin te doen is;
- op de plattegrond bekijken waar een plant staat;
- de volledige plantenbibliotheek bekijken;
- informatie en drukwerk voor de tuin gebruiken.

## Lokaal starten

Deze site gebruikt Node.js 22 of nieuwer.

```bash
npm install
npm run dev
```

Open daarna het adres dat in de terminal wordt getoond. Controleer wijzigingen met:

```bash
npm run lint
npx tsc --noEmit
```

Lokale instellingen horen in `.env.local`. Dat bestand wordt bewust niet naar GitHub
gestuurd; gebruik `.env.example` als beginpunt.

## Hoe GitHub hier werkt

GitHub is de plek waar de code en de geschiedenis van dit project worden bewaard.

- `main` is de huidige hoofdversie.
- Een **commit** is een opgeslagen momentopname van wijzigingen.
- `git push` zet lokale commits op GitHub.
- De live site hierboven is een aparte publicatie. Een push naar GitHub verandert de
  live site dus niet automatisch.

Voor een volgende wijziging:

```bash
git status
git add <bestand>
git commit -m "Korte beschrijving van de wijziging"
git push
```

De repository staat op [github.com/Zmkoks/tuin_weener](https://github.com/Zmkoks/tuin_weener).
