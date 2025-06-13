// app.js

// -----------------------------
// 1) Manuell prislista per aktie för årets öppningskurs och aktuellt pris
// -----------------------------
const TICKER_OVERRIDE_YEAR = {
  "BALDB":       { yearOpen: 76.96, current: 64.82 },
  "Bonesupport": { yearOpen: 398.6, current: 266.6 },
  "Norion Bank": { yearOpen: 38.0,  current: 48.55 },
  "KFast":       { yearOpen: 16.94,  current: 12.98 },
  "Sagax":       { yearOpen: 228.0, current: 210.8 },
  "Sagax D":     { yearOpen: 31.4,  current: 33.6 },
  "Sagax A":     { yearOpen: 228.0, current: 210.8 },
  "Lifco B":     { yearOpen: 326.6, current: 395.4 },
  "LUND-B":      { yearOpen: 507.0, current: 487.2 },
  "HMB":         { yearOpen: 148.75, current: 136.3 },
  "Hexagon B":   { yearOpen: 106.15, current: 98.28 },
  "Volvo":       { yearOpen: 269.8, current: 265.4 },
  "EQT":         { yearOpen: 309.2, current: 288.7 },
  "Atlas Copco": { yearOpen: 171.65, current: 158.1 },
  "Sandvik":     { yearOpen: 201.2, current: 215.20 },
  "Securitas":   { yearOpen: 107.65, current: 140.9 },
  "Bure Equity": { yearOpen: 392.4, current: 287.8 },
  "Essity":      { yearOpen: 297.0, current: 272.7 },
  "Skanska":     { yearOpen: 237.1, current: 233.5 },
  "Apotea":      { yearOpen: 86.55,  current: 97.42 },
  "Epiroc":      { yearOpen: 195.5, current: 216.7 },
  "AXFO":        { yearOpen: 236.0, current: 277.1 },
  "Dustin Group":{ yearOpen: 2.53,  current: 2.01 },
  "Getinge B":   { yearOpen: 183.65, current: 190.75 },
  "Arjo B":      { yearOpen: 36.3,  current: 33.0 },
  "Elanders B":  { yearOpen: 88.0,  current: 61.5 },
  "INDU-C":      { yearOpen: 354.2, current: 352.5 },
  "Holmen B":    { yearOpen: 409.8, current: 393.6 },
  "Handelsbanken A": { yearOpen: 116.1, current: 127.85 },
  "Alleima":     { yearOpen: 76.0,  current: 82.3 },
  "Hufvudstaden":{ yearOpen: 122.3, current: 123.8 },
  "Spotify":     { yearOpen: 4321.00, current: 6634.62 },
  "Latour B":    { yearOpen: 280.3, current: 261.0 },
  "AAK":         { yearOpen: 320.2, current: 268.8 },
  "NIBE":        { yearOpen: 43.69,  current: 40.32 },
  "Hexpol":      { yearOpen: 103.1,  current: 90.2 },
  "Assa Abloy":  { yearOpen: 327.8, current: 310.5 },
  "Hoist Finance":{yearOpen: 93.5,  current: 94.0 },
  "Swedish logistic property": { yearOpen: 39.5, current: 38.3 },
  "TFBank":      { yearOpen: 390.0, current: 376.0 },
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
  let cardsHtml = '';

  people.forEach((person, index) => {
    const imageUrl = person.image || "https://via.placeholder.com/80";
    const change = person.percentChangeYear || 0;
    const formattedChange = `${change < 0 ? '' : '+'}${change.toFixed(2)}% i år`;
    const changeColor = change < 0 ? 'red' : 'green';
    const wealthDisplay = formatWealthValue(person.wealth, currency);

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
        </div>
      </div>
    `;
  });

  const title = filterUnder50 ? "Topplista under 50 år" : "Topplista:";
  listSection.innerHTML = `<h2><span class="pulse-dot"></span> ${title}</h2>` + cardsHtml;
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
