# Wetzicht

Wetzicht laat zien welke wetswijzigingen voor ondernemers een specifiek bedrijf raken. De site staat op https://wetzicht.nl.

## Hoe het werkt

- `site/` is de website. Alles draait in de browser van de bezoeker. Er is geen server en er worden geen antwoorden verstuurd.
- `pipeline/update.mjs` haalt de officiële lijst met wetswijzigingen op en schrijft `site/data/changes.js`.
- `site/data/rules.js` legt per wijziging vast voor welk soort bedrijf die geldt.
- `.github/workflows/publish.yml` ververst de lijst elke dag en publiceert de site.

## Bron en rechten

De teksten van de wetswijzigingen komen van [Ondernemersplein](https://ondernemersplein.overheid.nl/wetswijzigingen/) (KVK en Rijksoverheid) en zijn beschikbaar onder [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.nl). Ze worden ongewijzigd overgenomen.

De code, de vormgeving en de indeling per soort bedrijf zijn van Wetzicht. Alle rechten voorbehouden.

Wetzicht is een signalering en geen juridisch advies.
