# PulsLab

Aplicație locală pentru proiectul didactic Arduino Uno + MAX30100. React, Vite, JavaScript și Tailwind CSS v4. Procesarea se face exclusiv în browser; nu există server de date și nu se trimit măsurători în cloud.

## Instalare și rulare

Node.js 20.19+ sau 22.12+ și npm. Pentru USB: Chrome sau Edge desktop pe localhost. Pe telefon se poate folosi simulatorul; conectarea USB nu este garantată.

```sh
cd pulslab-web
npm install
npm run dev
```

Deschide adresa afișată de Vite. Apasă **Pornește demo**, așteaptă aproximativ 5–10 secunde și verifică pulsul. Pentru hardware, închide Serial Monitor din Arduino IDE și apasă **Conectează Arduino**.

```sh
npm test
npm run build
npm run preview
```

Dacă există pnpm instalat, comenzile echivalente sunt `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm build`.

## Funcții

- W1–W2: conectare USB la 115200 baud, citire pe fragmente, deconectare, contor de linii invalide.
- W3–W4: estimare DC exponențială (constantă 1,5 s), trece-jos de ordin 1 configurabil, inversare, maxime locale cu prag adaptiv și perioadă refractară; BPM din mediana ultimelor 7 intervale; SpO₂ din raportul AC/DC pe 4 secunde.
- W5–W8: canvas animat, istoric 5/10/20 secunde, marcaje bătăi, mesaje privind calitatea, rata de recepție măsurată pe 5 secunde, pierderi din secvență, consistența intervalelor și setări live.
- W9–W12: teme memorate local, layout adaptabil, simulator 100 Hz, scenarii fără deget/mișcare/saturație, jurnal limitat la 100 mesaje. React se actualizează la 5 Hz, graficul separat prin requestAnimationFrame.
- W13–W14 bonus: export CSV (primele 180.000 eșantioane, aproximativ 30 min), RMSSD și SDNN orientative. W15 nu este implementat.

Funcționalitățile USB și fluiditatea graficului trebuie verificate pe calculatorul și placa folosite la prezentare. Implementarea nu echivalează cu validarea cerințelor pe hardware.

## Structură

`src/protocol.js`: parser și buffer de linii; `serial.js`: Web Serial; `processor.js`: procesare independentă de React; `simulator.js`: date sintetice; `main.jsx`: interfață și grafic; `styles.css`: temă și layout; `tests/core.test.js`: teste automate de protocol și procesare.

## Conectare hardware

| MAX30100 | Arduino Uno                     |
| -------- | ------------------------------- |
| VIN      | 5 V, conform modulului utilizat |
| GND      | GND                             |
| SCL      | A5                              |
| SDA      | A4                              |
| INT      | D2, opțional                    |

Firmware-ul nu este inclus în această etapă. Trebuie să producă date brute la 100 Hz și să implementeze protocolul de mai jos.

## Protocol

Fiecare linie se termină cu `\n` (se acceptă și CRLF).

| Direcție    | Mesaj                | Semnificație                                       |
| ----------- | -------------------- | -------------------------------------------------- |
| Placă → web | `D,<nr>,<ir>,<red>`  | Secvență crescătoare și valori ADC întregi 0–65535 |
| Placă → web | `#text`, `#ERR text` | Mesaj informativ sau eroare                        |
| Web → placă | `L7,7`               | Indecși LED IR și RED 0–15                         |
| Web → placă | `P` / `S`            | Pauză / pornire                                    |
| Web → placă | `?`                  | Interogare configurație                            |

Timpul semnalului este calculat ca `nr × 10 ms`, presupunând firmware la 100 Hz. Rata afișată este rata efectivă de recepție în browser; transportul USB poate livra date în loturi. Secvențele care scad sunt tratate ca restart al achiziției. Pierderile se numără cumulativ în sesiune. Numărătoarea bătăilor și timestampurile nu sunt o măsurare de timp validată pe hardware.

## Algoritmi și limite

Pragul de prezență implicit 5000 ADC și pragurile de calitate sunt euristice: se calibrează pe montajul real. Semnalul este declarat instabil dacă variația RMS este foarte mică sau depășește 4% din DC. Consistența este `100 × (1 − SD(intervale) / medie(intervale))`, limitată inferior la zero. Acest indicator nu este un scor clinic.

SpO₂ se estimează prin `110 − 25 × (AC_RED/DC_RED)/(AC_IR/DC_IR)`, unde AC este deviația standard a valorilor brute pe fereastră. Rezultatele în afara 70–100% nu se afișează. Mișcarea și tranzienții pot produce estimări greșite. Nu există calibrare medicală. RMSSD/SDNN sunt calculate pe maximum 20 intervale și nu sunt echivalente cu un studiu HRV clinic.

## Verificare manuală înainte de predare

1. Demo la 48, 72, 120 BPM; compară după stabilizare. Comută istoricul și setările.
2. Schimbă scenariile: fără deget și saturație trebuie să invalideze valorile; pentru mișcare urmărește mesajul de instabilitate.
3. Verifică temele, reîncărcarea paginii și layout la 390 px.
4. Conectează placa, scoate cablul în timpul achiziției, reconectează; verifică P/S, LED și `?`.
5. Injectează linii invalide și salturi de secvență; verifică numărătorile. Rulează minimum 5 minute pe hardware, apoi exportă CSV.
6. Efectuează cele 15 măsurători comparative cerute în îndrumar; documentează separat erorile și limitele reale.

## Referințe de implementare

- https://developer.chrome.com/docs/capabilities/serial
- https://vite.dev/guide/
- https://tailwindcss.com/docs/installation/using-vite
- Caietul de sarcini PulsLab, secțiunile 4.4–4.6.

Prototip exclusiv didactic. Valorile nu au valoare medicală și nu se folosesc pentru diagnostic sau decizii privind sănătatea. Utilizarea AI pentru realizarea aplicației trebuie declarată în Anexa D, conform îndrumarului.
