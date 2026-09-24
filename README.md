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

## Werkhandleidingen

- [IT-overdracht: hosting, broncode, database en verhuizing](README-IT.md)
- [Kaart en drukwerk aanpassen](README-KAART-EN-DRUKWERK.md)
- [Overige wijzigingen en onderhoud](README-ONDERHOUD.md)

## Lokaal starten

Deze site gebruikt Node.js 22.13 of nieuwer.

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

## Broncode en publicatie

De code staat in een Git-repository met twee remotes: `origin` is de bronrepository die
aan Sites is gekoppeld; `github` wijst naar
[github.com/Zmkoks/tuin_weener](https://github.com/Zmkoks/tuin_weener). De lokale
`main` volgt GitHub. Op 23 september 2026 liep GitHub vijf commits achter op de lokale
hoofdversie; controleer de stand voordat je GitHub als actuele overdrachtskopie gebruikt.

Een push naar GitHub publiceert de openbare site niet. Productie wordt apart via Sites
gebouwd, opgeslagen en uitgerold. Gebruik voor eigenaarschap, gegevens, geheimen en een
eventuele verhuizing de [IT-overdracht](README-IT.md); voer geen ongerichte push naar een
remote uit om de productie te proberen bij te werken.
