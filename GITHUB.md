# Publicarea pe GitHub Pages

Repository-ul trebuie să conțină fișierele din acest folder la rădăcină: `package.json`, `src`, `.github` etc. Nu încărca `node_modules` sau `dist`.

În Settings → Pages → Build and deployment alege Source: GitHub Actions. Workflow-ul `.github/workflows/pages.yml` testează, construiește și publică la fiecare push pe `main`. Adresa finală apare în Actions după terminarea publicării. Build-ul folosește căi relative pentru a suporta și adrese de forma `username.github.io/repository/`.

Publicarea interfeței nu sincronizează automat măsurătorile între calculatoare. Fiecare instanță are propria sesiune USB/demo. Pentru afișarea aceleiași sesiuni pe pagina online este necesar un serviciu de sincronizare separat. Această integrare nu este încă configurată.
