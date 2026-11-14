# Rezidentní parkování v Brně

Přehled pravidel rezidentního parkování ve městě Brně (stav k 12. 11. 2026).

> Informace jsou sesbírány z oficiálních stránek města a projektu Parkování v Brně. Pro závazné a aktuální znění vždy ověřte u zdroje (viz [Zdroje](#zdroje)).

## Webová mapa zón

Soubor [`index.html`](index.html) otevřete přímo v prohlížeči (stačí HTML, JS a SVG, bez serveru). Vzhled (písma Source Sans 3 / Source Serif 4, červený akcent, tmavý režim) je převzatý z projektu [elections-brno](https://github.com/Pajinek/elections-brno); bez internetu se místo písem Source použijí systémová. Zobrazuje mapu Brna z OpenStreetMap se zónami A/B/C a rezidentními oblastmi. Po kliknutí na oblast ukáže její „květinku“ (viz [pravidla](docs/zony-a-kytickova-pravidla.md)). Odkaz na konkrétní oblast: `index.html?oblast=1-14` (vrstvy lze zadat jako `&vrstvy=zony,oblasti,vjezdy`).

Mapová data jsou předpočítaná v `js/map-data.js`. Aktualizace:

```bash
tools/fetch-osm.sh      # stáhne silnice, vodu, zeleň z Overpass API do data/raw/
node tools/build-data.js # vygeneruje js/map-data.js
```

Polygony zón a oblastí (`data/raw/zones-source.json`) pocházejí z mapy [parkovanivbrne.cz](https://www.parkovanivbrne.cz/mapa/), podklad © přispěvatelé [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL).

## Obsah

- [Kdo může o oprávnění žádat](#kdo-může-o-oprávnění-žádat)
- [Kolik to stojí](#kolik-to-stojí)
- [Volné hodiny pro návštěvy](#volné-hodiny-pro-návštěvy)
- [Změna SPZ (registrační značky)](#změna-spz-registrační-značky)
- [Platnost a prodloužení](#platnost-a-prodloužení)
- [Jak oprávnění vyřídit](#jak-oprávnění-vyřídit)
- [Zóny a princip „květinky“](#zóny-a-princip-květinky)
- [Další pravidla a výjimky](#další-pravidla-a-výjimky)
- [Rozšiřování systému v roce 2026](#rozšiřování-systému-v-roce-2026)
- [Kontakty](#kontakty)
- [Zdroje](#zdroje)

## Kdo může o oprávnění žádat

Rezidentní oprávnění může získat:

- **Fyzická osoba s trvalým pobytem** ve vymezené (regulované) oblasti.
- **Fyzická osoba, která je vlastníkem nemovitosti** ve vymezené oblasti.
- **Cizinci z EU** (včetně Islandu, Lichtenštejnska, Norska a Švýcarska) s osvědčením o registraci, přechodným nebo dlouhodobým pobytem.
- **Cizinci mimo EU** s povoleným trvalým nebo dlouhodobým pobytem, s vízem k pobytu nad 90 dní nebo s přiznaným azylem.

Důležité podmínky a poznámky:

- Rozhoduje **adresa trvalého pobytu v dokladech**, ne místo, kde skutečně bydlíte.
- **Nájemník bez trvalého pobytu** v oblasti rezidentní oprávnění nezíská. Řešením je změna trvalého pobytu.
- Jako trvalý pobyt se **nepočítá** adresa sídla ohlašovny nebo zvláštní matriky vedená jako adresa úřadu.
- U družstevního bytu je nutný trvalý pobyt v bytě. Samotný podíl v družstvu se za vlastnictví nepočítá.
- K vozidlu musíte mít **právní vztah**: vlastnictví, provozování, leasing, úvěr nebo vozidlo svěřené zaměstnavatelem.
- **Firmy a podnikatelé** rezidentní oprávnění nezískají. Mají vlastní kategorii (abonent, viz níže).
- Oprávnění **není automatické**, vydává se vždy jen na základě žádosti.

### Co doložit

| Žadatel | Doklady |
| --- | --- |
| Občan ČR | občanský průkaz nebo cestovní doklad |
| Občan EU | cestovní doklad + osvědčení o registraci / průkaz o povolení k trvalému pobytu / potvrzení o přechodném pobytu |
| Cizinec mimo EU | cestovní doklad + průkaz o povolení k pobytu (trvalý pobyt) |
| Dlouhodobý pobyt / vízum nad 90 dní / azyl | cestovní doklad + povolení k dlouhodobému pobytu / dlouhodobé vízum / průkaz povolení k pobytu azylanta |
| Vlastník nemovitosti | doklad o vlastnictví |

K vozidlu: osvědčení o registraci (technický průkaz). Navíc podle situace:

- **leasing / nájem** – smlouva (pronajímatel musí mít živnost na pronájem movitých věcí),
- **vozidlo ve společném jmění manželů** – oddací list,
- **služební vozidlo** – potvrzení od zaměstnavatele.

## Kolik to stojí

### Rezidentní oprávnění (cena za osobu a rok)

| Pořadí vozidla | Cena za rok |
| --- | --- |
| 1. vozidlo | **800 Kč** |
| 2. vozidlo | **8 000 Kč** |
| 3. a každé další vozidlo | **12 000 Kč** |

- Cena se počítá **na osobu**. Pokud mají dva dospělí s trvalým pobytem v oblasti každý jedno auto, platí oba po 800 Kč.
- Jedna osoba se třemi auty: 800 + 8 000 + 12 000 = **20 800 Kč** ročně.
- **Přívěsný vozík** se bere jako samostatné vozidlo (cena podle pořadí).
- **Motocykl**: oprávnění je **zdarma (0 Kč)**, platí rok. Nemusí se dokládat trvalý pobyt, stačí technický průkaz motocyklu. Bez oprávnění parkují motocykly v režimu návštěvníka (placené).
- **Držitelé průkazu ZTP/P**: oprávnění zdarma (viz [Další pravidla](#další-pravidla-a-výjimky)).
- **Změny SPZ jsou bez poplatku.**
- Elektromobily a hybridy se v systému **berou stejně** jako vozidla se spalovacím motorem.
- Oprávnění je platné **až po připsání platby** na účet. Potvrzení přijde e-mailem.

### Ostatní oprávnění (pro srovnání)

| Typ oprávnění | Cena |
| --- | --- |
| Abonent (podnikatel se sídlem/provozovnou/nemovitostí v oblasti), 1. vozidlo | 4 000 Kč / rok |
| Abonent, 2. a každé další vozidlo | 18 000 Kč / rok |
| Přenosné abonentní oprávnění (pro hosty a klienty firmy) | 24 000 Kč / rok |
| Vlastník nemovité věci – právnická osoba, 1. oprávnění | 4 000 Kč / rok |
| Vlastník nemovité věci – právnická osoba, 2. a další | 18 000 Kč / rok |
| Dlouhodobé oprávnění pro návštěvníky – 1 měsíc | 1 600 Kč |
| Dlouhodobé oprávnění pro návštěvníky – 1 rok | 16 000 Kč |

### Ceny pro návštěvníky (bez oprávnění)

| Zóna | Cena |
| --- | --- |
| Zóna B (prstenec kolem centra) | prvních 60 min denně zdarma, dále **40 Kč/hod.** |
| Zóna C (zbytek zapojených oblastí) | prvních 60 min denně zdarma, dále **30 Kč/hod.** |
| Zóna A (historické centrum) | krátkodobé parkování nelze koupit, parkovat mohou jen držitelé dlouhodobého oprávnění |

Hodina zdarma se obnovuje o půlnoci a **i ona vyžaduje registraci** (automat v zóně B, aplikace ParkSimply / EasyPark, online automat). Hodinu zdarma nelze využít s přesahem přes půlnoc a pak znovu další den.

## Volné hodiny pro návštěvy

Každý rezident (s trvalým pobytem, občan EU nebo vlastník nemovitosti) má nárok na **volné parkovací hodiny pro své návštěvy**. Nezáleží na věku ani na tom, zda vlastní auto.

| Zóna rezidenta | Zdarma za rok | Dokoupení | Cena dokoupení |
| --- | --- | --- | --- |
| **A a B** | **200 hodin** | dalších 100 hodin | 200 Kč |
| **C** | **100 hodin** | dalších 50 hodin | 200 Kč |

Maximálně tedy **300 hodin ročně** (zóna A/B) nebo **150 hodin ročně** (zóna C).

### Dokoupení dalších hodin

Pokud vám základní hodiny nestačí, můžete si **jednou ročně** dokoupit další:

| Zóna rezidenta | Co lze dokoupit | Cena |
| --- | --- | --- |
| A a B | +100 hodin | **200 Kč** |
| C | +50 hodin | **200 Kč** |

Postup v osobní stránce uživatele (OSU):

1. Na úvodní obrazovce zvolte *Nové oprávnění*.
2. V kategoriích vyberte **Parkovací hodiny pro Rezidenty dodatečné**. Základní hodiny jsou jiná kategorie a jsou zdarma.
3. Vyplňte **oblast parkování**, **pořadové číslo vozidla** (zadejte 1) a **začátek platnosti**.
4. Dobu platnosti zvolte **Rok**.
5. Nechte **spočítat cenu** (200 Kč) a odešlete žádost.
6. V přehledu žádostí zvolte **Zaplatit**. Platební instrukce přijdou e-mailem na registrační adresu.

Poznámky:

- Žádost podléhá schválení a hodiny platí až po **připsání platby**.
- Dokoupit lze jen **jednou ročně**. Dokoupené hodiny platí rok.
- Nárok má každý rezident včetně dětí. Dítěti stačí zřídit přístup do OSU, potvrzením je rodný list.
- Hodiny jde využít i pro přívěs. Jedna SPZ návštěvy najednou platí i pro dokoupené hodiny.
- Pro návštěvníky, kteří žádného rezidenta nemají, existuje v OSU také kategorie **Předplacený POP** (předplacené oprávnění do zóny B).
- Zůstatek hodin vidíte na úvodní obrazovce OSU a návštěvu registrujete přes *Registrace návštěvníka* (platí okamžitě, bez schvalování).

Pravidla:

- O hodiny je nutné **požádat** (jednou za rok): v osobní stránce uživatele (OSU) *Nové oprávnění → Parkovací hodiny pro Rezidenta základní*.
- Hodiny mají **platnost 1 rok**, poté je třeba požádat znovu. Počet hodin se aktualizuje až v den, kdy oprávnění začne platit.
- Hodiny se přidělují návštěvě v OSU přes *Registrace návštěvníka* (datum, čas začátku a konce, SPZ).
- **Jen jedna SPZ najednou** v platném oprávnění (nelze používat pro více návštěv současně).
- Návštěva může parkovat v „květince“ rezidenta (jeho oblast + všechny sousedící oblasti).
- Rezident ze zóny A (historické centrum) může hodiny poskytnout také, ale kvůli zákazu vjezdu musí návštěva parkovat v sousedních oblastech zóny B.
- „Návštěvou“ může být i služba (dovoz zboží, stěhování apod.).
- Hodiny lze využít i pro přívěsný vozík nebo vozidlo s převozní značkou.
- Nárok mají i **nezletilí** s trvalým pobytem v oblasti (do přílohy se vkládá rodný list dítěte).
- Hodiny jsou určeny jen pro rezidenty s trvalým pobytem, cizince z EU a vlastníky nemovitostí v dané oblasti.

## Změna SPZ (registrační značky)

### Dočasná změna

Typicky pro vozidlo v servisu a náhradní auto.

| Parametr | Pravidlo |
| --- | --- |
| Počet změn | **až 4× ročně** (během platnosti oprávnění) |
| Maximální délka | **celkem 14 dní** (součet všech dočasných změn) |
| Schvalování | **není nutné**, změna platí okamžitě |
| Poplatek | zdarma |
| Zkrácení | lze kdykoliv zkrátit |
| Zpětně | **nelze**, datum i čas musí být v budoucnu |
| Důvod | není nutné ho uvádět |

Po vyčerpání 4 změn nebo 14 dní už další dočasná změna není možná. Pokud je auto v servisu déle, použijte trvalou změnu a doložte důvod (např. potvrzení ze servisu).

Tip: pokud máte potvrzení ze servisu (objednávka, předávací protokol), je lepší zvolit rovnou trvalou změnu, abyste si nevyčerpali limit dočasných změn.

### Trvalá změna

Při prodeji auta a koupi nového.

| Parametr | Pravidlo |
| --- | --- |
| Počet změn | v pravidlech není stanoven pevný limit |
| Délka | trvalá, **původní SPZ v oprávnění zaniká** |
| Schvalování | **ano**, přes OSU trvá hodiny až dny. Osobně na Veveří 100 obratem |
| Poplatek | **zdarma** |
| Zpětně | nelze, datum a čas musí být v budoucnu |
| Dokumenty | osvědčení o registraci nového vozidla, u leasingu smlouva, u SJM oddací list |

Do schválení lze parkovat například přes volné hodiny pro rezidenty.

Díky trvalé změně nemusíte řešit nové parkovací oprávnění ani platit znovu.

## Platnost a prodloužení

- Rezidentní oprávnění platí **1 rok**.
- Prodloužit lze **nejdříve 2 měsíce před vypršením** platnosti (v OSU: *Prodloužení oprávnění*). Platební instrukce přijdou e-mailem.
- Prodloužit lze **jen platné** oprávnění. Po vypršení je nutná nová žádost se všemi doklady a do té doby parkujete v režimu návštěvníka.
- O blížícím se konci platnosti jste informováni e-mailem (pokud vyřizujete přes OSU).
- Oprávnění se neprodlužuje automaticky (jde o vydání na základě žádosti dle § 158 správního řádu).

## Jak oprávnění vyřídit

1. **Žádost o osobní stránku uživatele (OSU)**:
   - elektronicky přes registrační formulář na [parkovanivbrne.cz](https://www.parkovanivbrne.cz/parkovani-rezidenti),
   - přes městský účet **Brno iD**,
   - e-mailem na `parkovanivbrne@brno.cz` nebo datovou schránkou `a7kbrrn`.
2. **Doložení dokladů** (pobyt/vlastnictví + vozidlo).
3. **Zaplacení poplatku** dle ceníku. Elektronicky bankovním převodem (údaje po schválení), na pracovišti kartou nebo hotově.

Doba vyřízení: běžně do **10 dní**, zákonná lhůta maximálně **30 dní**.

**Osobně:** Referát parkovacích oprávnění, **Veveří 1032/100** (ACADEMY PARK), vyřízení obratem. Je možné se objednat online.

| Den | Úřední hodiny |
| --- | --- |
| Pondělí | 8:00–17:00 |
| Středa | 8:00–17:00 |
| Pátek | 8:00–12:00 |

V zastoupení je nutná plná moc.

## Zóny a princip „květinky“

| Zóna | Popis | Doba regulace |
| --- | --- | --- |
| **A** | historické centrum (oblast 1-01), zákaz vjezdu bez povolení | jen s dlouhodobým oprávněním |
| **B** | prstenec kolem centra | pracovní dny celodenně, neděle 17:00–24:00. Soboty a svátky zdarma |
| **C** | zbytek zapojených oblastí | pracovní dny **17:00–6:00**. Víkendy a svátky bez regulace |

**Květinka:** rezidentní oprávnění platí v **oblasti, kde bydlíte, i ve všech sousedících oblastech** (oblast se dotýká hranou nebo rohem). Výjimka: **historické centrum (1-01) nemůže být „okvětním lístkem“**. Parkovat tam mohou jen rezidenti/abonenti z této oblasti, a to v rámci své podoblasti.

Do zóny C nespadá celé Brno, jen oblasti, které se do systému připojily.

Podrobný rozbor (kdo kde může parkovat, podoblasti historického centra, vjezdy, mapy) a stažené PDF najdeš v [`docs/zony-a-kytickova-pravidla.md`](docs/zony-a-kytickova-pravidla.md).

## Další pravidla a výjimky

- **ZTP/P**: bezplatné oprávnění. V každé oblasti **3 hodiny jednou denně zdarma**. Oprávnění slouží i k vjezdu do historického centra. Potřebný je OP/pas, průkaz OZP se symbolem ZTP/P a parkovací průkaz. Na vyhrazených místech pro OZP se není nutné registrovat, ale parkovací průkaz musí být za sklem.
- **Zóna E** (nabíjecí stanice elektromobilů): označeno P reservé + dodatková tabulka. Při dobíjení zdarma, je ale nutná registrace (ParkSimply, EasyPark, online automat). Oprávnění na 6, 12, 18 nebo 24 hodin. Další až 24 hodin po skončení předchozího.
- **Zákaz vjezdu do historického centra** hlídá kamerový systém. Vjezd jen s povolením.
- **Přenosné abonentní oprávnění** do oblasti 1-01 neumožňuje vjezd, jen parkování v okolních oblastech.
- **Platba parkování** (návštěvníci): parkovací automat (zóna B), aplikace ParkSimply / EasyPark, online parkovací automat, SMS.
- Na stránce města se uvádí, že výnosy jdou do **Fondu mobility** (zlepšení parkování, nová parkoviště, dopravní opatření).

## Rozšiřování systému v roce 2026

Do zóny C (regulace v pracovní dny 17:00–6:00) se připojují další oblasti:

| Datum | Oblast |
| --- | --- |
| 27. 4. 2026 | 18-01 (Dolnopolní), 18-02 (Obřanská) |
| 25. 5. 2026 | 18-04 (Hády) |
| 3. 8. 2026 | 8-02 (Spodní) |
| 29. 9. 2026 | 9-01 (Dunajská) |
| 5. 10. 2026 | 8-01 (Kamenice) |
| 2. 11. 2026 | 9-02 (Bosonožská) |

## Kontakty

- Web: <https://www.parkovanivbrne.cz>
- E-mail: `parkovanivbrne@brno.cz`
- Datová schránka: `a7kbrrn`
- Kontaktní pracoviště: Veveří 1032/100, Brno (ACADEMY PARK)

## Zdroje

- [Parkování pro rezidenty – parkovanivbrne.cz](https://www.parkovanivbrne.cz/parkovani-rezidenti)
- [Otázky a odpovědi – parkovanivbrne.cz](https://www.parkovanivbrne.cz/otazky-a-odpovedi)
- [Nařízení a ceník – parkovanivbrne.cz](https://www.parkovanivbrne.cz/dokumenty/parkovani-narizeni-a-cenik-2)
- [Parkovací oprávnění pro rezidenty – brno.cz](https://www.brno.cz/w/parkovaci-opravneni-pro-rezidenty)
- [Rezidentní parkování Brno: ceny 2026 a žádost – vsude.cz](https://www.vsude.cz/rezidentni-parkovani-brno/) (neoficiální, doplňující informace)
