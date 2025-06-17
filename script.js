// app.js

// -----------------------------
// 1) Manuell prislista per aktie för årets öppningskurs och aktuellt pris
// -----------------------------
const TICKER_OVERRIDE_YEAR = {
  "BALDB":       { yearOpen: 76.96, current: 66.02 },
  "Bonesupport": { yearOpen: 398.6, current: 266.0 },
  "Norion Bank": { yearOpen: 38.0,  current: 47.75 },
  "KFast":       { yearOpen: 16.94,  current: 13.08 },
  "Sagax":       { yearOpen: 228.0, current: 206.8 },
  "Sagax D":     { yearOpen: 31.4,  current: 33.75 },
  "Sagax A":     { yearOpen: 228.0, current: 208.0 },
  "Lifco B":     { yearOpen: 326.6, current: 383.6 },
  "LUND-B":      { yearOpen: 507.0, current: 468.2 },
  "HMB":         { yearOpen: 148.75, current: 131.35 },
  "Hexagon B":   { yearOpen: 106.15, current: 92.14 },
  "Volvo":       { yearOpen: 269.8, current: 261.6 },
  "EQT":         { yearOpen: 309.2, current: 277.0},
  "Atlas Copco": { yearOpen: 171.65, current: 152.25 },
  "Sandvik":     { yearOpen: 201.2, current: 213.10 },
  "Securitas":   { yearOpen: 107.65, current: 137.95 },
  "Bure Equity": { yearOpen: 392.4, current: 272.4 },
  "Essity":      { yearOpen: 297.0, current: 260.0 },
  "Skanska":     { yearOpen: 237.1, current: 227.6},
  "Apotea":      { yearOpen: 86.55,  current: 85.88 },
  "Epiroc":      { yearOpen: 195.5, current: 212.5 },
  "AXFO":        { yearOpen: 236.0, current: 275.9 },
  "Dustin Group":{ yearOpen: 2.53,  current: 2.11 },
  "Getinge B":   { yearOpen: 183.65, current: 184.7 },
  "Arjo B":      { yearOpen: 36.3,  current: 31.94 },
  "Elanders B":  { yearOpen: 88.0,  current: 58.2 },
  "INDU-C":      { yearOpen: 354.2, current: 340.1 },
  "Holmen B":    { yearOpen: 409.8, current: 376.6 },
  "Handelsbanken A": { yearOpen: 116.1, current: 125.75 },
  "Alleima":     { yearOpen: 76.0,  current: 81.2 },
  "Hufvudstaden":{ yearOpen: 122.3, current: 119.3 },
  "Spotify":     { yearOpen: 4342.91, current: 6826.70 },
  "Latour B":    { yearOpen: 280.3, current: 244.2 },
  "AAK":         { yearOpen: 320.2, current: 261.0},
  "NIBE":        { yearOpen: 43.69,  current: 39.99 },
  "Hexpol":      { yearOpen: 103.1,  current: 87.75 },
  "Assa Abloy":  { yearOpen: 327.8, current: 300.3 },
  "Hoist Finance":{yearOpen: 93.5,  current: 94.15 },
  "Swedish logistic property": { yearOpen: 39.5, current: 39.95 },
  "TFBank":      { yearOpen: 390.0, current: 367.5 },
  // … fortsätt med alla tickers och deras årsupplagningsvärden …
};

// -----------------------------
// 2) Hämta årspriser utan API
// -----------------------------
async function fetchStockPricesYearly(tickers) {
  const stockData = {};

  tickers.forEach(t => {
    const o = TICKER_OVERRIDE_YEAR[t] || {};
    const start = o.yearOpen || 0;
    const now   = o.current   || 0;
    const dpYear = start
      ? ((now - start) / start * 100)
      : 0;
    stockData[t] = { price: now, startPrice: start, dpYear };
  });

  return stockData;
}

// --- Resten av koden förblir oförändrad ---
// Funktion för att räkna ut ålder baserat på födelsedatum (format: "YYYY-MM-DD")
function calculateAge(birthdate) {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Hjälpfunktion för att formatera förmögenhet till miljarder
function formatWealthValue(wealth, currency) {
  if (currency === "SEK") {
    const billions = wealth / 1e9;
    return billions.toFixed(0) + " miljarder kr";
  } else {
    const wealthUSD = wealth / 9.61;
    const billions = wealthUSD / 1e9;
    return "$" + billions.toFixed(1) + " miljarder";
  }
}

// CSS för pulsande röd pricka
function injectPulseDotCSS() {
  const style = document.createElement('style');
  style.innerHTML = `
    .pulse-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      background-color: red;
      border-radius: 50%;
      margin-right: 10px;
      vertical-align: middle;
      animation: pulse 1.5s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

let cachedPeopleWithWealth = null;

async function initializeData() {
  if (cachedPeopleWithWealth) return cachedPeopleWithWealth;

  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Kunde inte hämta data.json");
    const people = await response.json();

    const tickers = [
      ...new Set(
        people.flatMap(person =>
          (person.holdings || []).map(h => h.ticker)
        )
      )
    ];

    const stockData = await fetchStockPricesYearly(tickers);

    cachedPeopleWithWealth = people.map(person => {
      // Räkna värde vid årets början och aktuellt värde
      let initialValue = 0;
      let currentValue = 0;

      (person.holdings || []).forEach(h => {
        const shares = h.shares || 0;
        const data = stockData[h.ticker] || {};
        initialValue += shares * (data.startPrice || 0);
        currentValue += shares * (data.price || 0);
      });

      // Privatdel: lägg till privholdingsyopen som start och privholdings som nu
      const privateStart   = parseFloat(person.privholdingsyopen) || 0;
      const privateCurrent = parseFloat(person.privholdings)     || 0;
      initialValue += privateStart;
      currentValue += privateCurrent;

      // Procentuell förändring i år baserat på total förmögenhet
      let percentChangeYear = 0;
      if (initialValue > 0) {
        percentChangeYear = (currentValue - initialValue) / initialValue * 100;
      }

      person.wealth = currentValue;
      person.percentChangeYear = percentChangeYear;
      person.age = calculateAge(person.birthdate);
      return person;
    });

    return cachedPeopleWithWealth;
  } catch (error) {
    console.error("Fel vid inläsning eller beräkning av data:", error);
    return [];
  }
}

async function loadDataAndRender(currency = "USD", filterUnder50 = false) {
  const people = await initializeData();

  let filteredPeople = [...people];
  if (filterUnder50) {
    filteredPeople = filteredPeople.filter(person => person.age < 50);
  }

  filteredPeople = filteredPeople
    .sort((a, b) => b.wealth - a.wealth)
    .slice(0, 25);

  renderCards(filteredPeople, currency, filterUnder50);
}

function renderCards(people, currency, filterUnder50) {
  const listSection = document.getElementById('list-section');
  // Rensa tidigare innehåll (förutom ev rubrik, om du t.ex. har en <h2> som ska behållas kan du rensa barn med klass .card)
  // Här antar vi att vi vill behålla eventuell rubrik i listSection, men enklast är att rensa allt och återskapa rubrik:
  let cardsHtml = `
    <h2><span class="pulse-dot"></span>De rikaste personerna</h2>
  `;
  people.forEach((person, index) => {
    const imageUrl = person.image || "https://via.placeholder.com/80";
    const change = person.percentChangeYear || 0;
    const formattedChange = `${change < 0 ? '' : '+'}${change.toFixed(2)}% i år`;
    const changeColor = change < 0 ? 'red' : 'green';
    // Formatera förmögenhet beroende på currency, antar du har formatWealthValue-funktion:
    const wealthDisplay = formatWealthValue(person.wealth, currency);
    // För mer-info: om person.moreInfo saknas, visa tom eller default-text:
     // --- Ändrad del: hantera moreInfo som array ---
   // ... inuti renderCards före cardsHtml += ...
    const infoArr = Array.isArray(person.moreInfo)
      ? person.moreInfo
      : [ person.moreInfo || "Ingen ytterligare information tillgänglig." ];
    const [firstLine, ...otherLines] = infoArr;
    // Bygg första rad
    let moreInfoHtml = '';
    if (firstLine) {
      const parts0 = firstLine.split(':');
      if (parts0.length > 1) {
        const label0 = parts0.shift().trim();
        const rest0 = parts0.join(':').trim();
        moreInfoHtml += `<p><strong>${label0}:</strong> ${rest0}</p>`;
      } else {
        moreInfoHtml += `<p>${firstLine.trim()}</p>`;
      }
    }
    // Bygg punktlista för resten
    const lis = otherLines
      .filter(line => line && line.trim())
      .map(line => {
        const parts = line.split(':');
        if (parts.length > 1) {
          const label = parts.shift().trim();
          const rest = parts.join(':').trim();
          return `<li><strong>${label}:</strong> ${rest}</li>`;
        } else {
          return `<li>${line.trim()}</li>`;
        }
      });
    if (lis.length) {
      moreInfoHtml += `<ul>${lis.join('')}</ul>`;
    }
    // --- Slut på ändring ---

    cardsHtml += `
      <div class="card">
        <img src="${imageUrl}" alt="Bild på ${person.name}">
        <div class="card-details">
          <div class="top-row">
            <span class="rank">${index + 1}.</span>
            <span class="name">${person.name}</span>
            <span class="age">(${person.age} år)</span>
          </div>
          <div class="bottom-row">
            <span class="company">${person.company}</span>
            <span class="change" style="color: ${changeColor};">${formattedChange}</span>
            <span class="wealth">Förmögenhet: ${wealthDisplay}</span>
          </div>
          <!-- Toggle-knapp -->
          <button class="toggle-details-btn" aria-expanded="false">Visa mer</button>
          <!-- Detaljsektion, gömd initialt pga CSS -->
          <div class="details">
            <p>${moreInfoHtml}</p>
          </div>
        </div>
      </div>
    `;
  });

  listSection.innerHTML = cardsHtml;

  // Efter att HTML är injicerad, fäster vi event listeners på knapparna:
  const toggleButtons = listSection.querySelectorAll('.toggle-details-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const cardDetails = btn.closest('.card-details');
      if (!cardDetails) return;
      const detailsEl = cardDetails.querySelector('.details');
      if (!detailsEl) return;
      // Kolla nuvarande state via aria-expanded eller maxHeight
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        // Collapse
        detailsEl.style.maxHeight = '0px';
        btn.textContent = 'Visa mer';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        // Expand: sätt max-height till scrollHeight
        const scrollH = detailsEl.scrollHeight;
        detailsEl.style.maxHeight = scrollH + 'px';
        btn.textContent = 'Visa mindre';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}


document.getElementById('currency-btn').addEventListener('click', function() {
  const filterUnder50 = document.getElementById('age-btn').dataset.filterActive === 'true';
  const newCurrency = this.innerHTML.includes("Byt till SEK") ? "SEK" : "USD";
  loadDataAndRender(newCurrency, filterUnder50);
});

document.getElementById('age-btn').addEventListener('click', function() {
  const currentCurrency = document.getElementById('currency-btn').innerHTML.includes("Byt till dollar") ? "SEK" : "USD";
  const newFilterState = this.dataset.filterActive !== 'true';
  this.dataset.filterActive = newFilterState;
  loadDataAndRender(currentCurrency, newFilterState);
});

document.addEventListener("DOMContentLoaded", () => {
  injectPulseDotCSS();
  document.getElementById('age-btn').dataset.filterActive = 'false';
  loadDataAndRender("USD", false);
});
