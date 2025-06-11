// app.js

// -----------------------------
// 1) Manuell prislista per aktie (öppnings- och stängningspris)
// -----------------------------
const TICKER_OVERRIDE = {
  "BALDB":       { open: 68.30, close: 66.02 },
  "Bonesupport": { open: 268.0, close: 266.6 },
  "Norion Bank": { open: 47.5, close: 47.75},
  "KFast":       { open: 13.0, close: 12.98 },
  "Sagax":       { open: 215.6, close: 210.8 },
  "Sagax D":     { open: 33.8, close: 33.6 },
  "Sagax A":     { open: 215.6, close: 210.8 },
  "Lifco B":     { open: 397.2, close: 397.6 },
  "LUND-B":      { open: 491.8, close: 487.2 }, 
  "HMB":         { open: 138.9, close: 136.3 },
  "Hexagon B":   { open: 98.48, close: 98.28 },
  "Volvo":       { open: 269.6, close: 265.4 },
  "EQT":         { open: 287.9, close: 288.7 },//avstlutade här
  "Atlas Copco": { open: 150.0, close: 158.1 },
  "Sandvik":     { open: 210.0, close: 215.20 },
  "Securitas":   { open: 135.0, close: 140.9 },
  "Bure Equity": { open: 280.0, close: 287.8 },
  "Essity":      { open: 265.0, close: 272.7 },
  "Skanska":     { open: 230.0, close: 233.5 },
  "Apotea":      { open: 95.0, close: 97.42 },
  "Epiroc":      { open: 210.0, close: 216.7 },
  "AXFO":        { open: 270.0, close: 277.1 },
  "Dustin Group":{ open: 1.90, close: 2.01 },
  "Getinge B":   { open: 185.0, close: 190.75 },
  "Arjo B":      { open: 32.0, close: 33.0 },
  "Elanders B":  { open: 60.0, close: 61.5 },
  "INDU-C":      { open: 345.0, close: 352.5 },
  "Holmen B":    { open: 385.0, close: 393.6 },
  "Handelsbanken A": { open: 125.0, close: 127.85 },
  "Alleima":     { open: 80.0, close: 82.3 },
  "Hufvudstaden":{ open: 120.0, close: 123.8 },
  "Spotify":     { open: 6300.00, close: 6618.41 }, //Översätt till SEK
  "Latour B":    { open: 255.0, close: 261.0 },
  "AAK":         { open: 260.0, close: 268.8 },
  "NIBE":        { open: 38.0, close: 40.32 },
  "Hexpol":      { open: 88.0, close: 90.2 },
  "Assa Abloy":  { open: 300.0, close: 310.5 },
  "Hoist Finance":{ open: 92.0, close: 94.0 },
  "Swedish logistic property": { open: 37.0, close: 38.3 },
  "TFBank":      { open: 370.0, close: 376.0 },
  // … fortsätt med alla tickers och deras prisvärden …
};

// -----------------------------
// 2) Hämta priser utan API
// -----------------------------
async function fetchStockPrices(tickers) {
  const stockData = {};

  tickers.forEach(t => {
    const o = TICKER_OVERRIDE[t] || { open: 0, close: 0 };
    const price = o.close;
    const dp = o.open ? ((o.close - o.open) / o.open * 100) : 0;
    stockData[t] = { c: price, dp };
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

    const stockData = await fetchStockPrices(tickers);

    cachedPeopleWithWealth = people.map(person => {
      const holdingsValue = (person.holdings || []).reduce((sum, h) => {
        const price = stockData[h.ticker]?.c || 0;
        return sum + (h.shares || 0) * price;
      }, 0);

      const privateValue = parseFloat(person.privholdings) || 0;
      person.wealth = holdingsValue + privateValue;

      if (person.holdings && person.holdings.length > 0) {
        person.percentChange = person.holdings.reduce((sum, h) => {
          return sum + (stockData[h.ticker]?.dp || 0);
        }, 0) / person.holdings.length;
      } else {
        person.percentChange = 0;
      }

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
    const change = person.percentChange || 0;
    const formattedChange = `${change < 0 ? '' : '+'}${change.toFixed(2)}% idag`;
    const changeColor = change < 0 ? 'red' : 'green';
    const wealthDisplay = formatWealthValue(person.wealth, currency);

    cardsHtml += `
      <div class="card">
        <img src="${imageUrl}" alt="Bild på ${person.name}">
        <div class="card-details">
          <div class="top-row">
            <span class="rank">${index + 1}.</span>
            <span class="name">${person.name}</span>
            <span class="age" style="margin-left: 10px;">(${person.age} år)</span>
          </div>
          <div class="bottom-row">
            <span class="company" style="margin-left: 10px;">${person.company}</span>
            <span class="change" style="color: ${changeColor}; margin-left: 10px;">${formattedChange}</span>
            <span class="wealth">Förmögenhet: ${wealthDisplay}</span>
          </div>
        </div>
      </div>
    `;
  });

  const title = filterUnder50 ? "Topplista under 50 år:" : "Topplista:";
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