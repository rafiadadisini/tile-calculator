// Utility functions for currency input and formatting
function parseRaw(el) {
  return parseInt((el.value || "").replace(/\D/g, "")) || 0;
}

// Format number as Indonesian Rupiah currency string
function formatCurrency(n) {
  return n ? n.toLocaleString("id-ID") : "";
}

// Format number as Indonesian Rupiah with "Rp " prefix
function fmt(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

// Event handlers for currency input fields
function onCurrencyInput(el) {
  const raw = parseRaw(el);
  const pos = el.selectionStart;
  const prevLen = el.value.length;
  el.value = raw ? formatCurrency(raw) : "";
  const diff = el.value.length - prevLen;
  try {
    el.setSelectionRange(pos + diff, pos + diff);
  } catch (e) {}
}

// No special handling on focus, but could be used to select all text or similar
function onCurrencyFocus(el) {}
function onCurrencyBlur(el, side) {
  const raw = parseRaw(el);
  el.value = raw ? formatCurrency(raw) : "";
  syncPrice(side);
}

// Set the value of a currency input field by ID, formatting it as currency
function setCurrencyValue(id, n) {
  document.getElementById(id).value = n ? formatCurrency(n) : "";
}

// Synchronize price per box and price per m² when one of them changes
function syncPrice(from) {
  const tw = parseFloat(document.getElementById("tw").value) || 0;
  const th = parseFloat(document.getElementById("th").value) || 0;
  const perbox = parseInt(document.getElementById("perbox").value) || 1;
  const tileArea = (tw / 100) * (th / 100);
  const boxArea = tileArea * perbox;
  if (from === "box") {
    const pb = parseRaw(document.getElementById("price-box"));
    setCurrencyValue("price-m2", boxArea > 0 ? Math.round(pb / boxArea) : 0);
  } else {
    const pm2 = parseRaw(document.getElementById("price-m2"));
    setCurrencyValue("price-box", Math.round(pm2 * boxArea));
  }
}

// Validate input fields and return error message if invalid, or null if valid
function validate() {
  const area = parseFloat(document.getElementById("area").value);
  const tw = parseFloat(document.getElementById("tw").value);
  const th = parseFloat(document.getElementById("th").value);
  const pb = parseInt(document.getElementById("perbox").value);
  if (!area || area <= 0) return "Luas area harus diisi dan lebih dari 0.";
  if (!tw || tw <= 0) return "Ukuran panjang granit harus diisi.";
  if (!th || th <= 0) return "Ukuran lebar granit harus diisi.";
  if (!pb || pb <= 0) return "Jumlah lembar per dus harus diisi.";
  return null;
}

// Handle form submission: validate inputs, calculate results, and display them
function handleSubmit() {
  const err = validate();
  const errEl = document.getElementById("error-msg");
  if (err) {
    errEl.textContent = err;
    return;
  }
  errEl.textContent = "";
  calc();
  const res = document.getElementById("result-section");
  res.style.display = "flex";
  res.scrollIntoView({ behavior: "smooth", flex: "start" });
}

// Perform the tile calculation based on input values and update the result display
function calc() {
  const area = parseFloat(document.getElementById("area").value) || 0;
  const waste = parseFloat(document.getElementById("waste").value) || 0;
  const tw = parseFloat(document.getElementById("tw").value) || 0;
  const th = parseFloat(document.getElementById("th").value) || 0;
  const perbox = parseInt(document.getElementById("perbox").value) || 0;
  const priceBox = parseRaw(document.getElementById("price-box"));

  const tileArea = (tw / 100) * (th / 100);
  const totalArea = area * (1 + waste / 100);
  const totalTiles = Math.ceil(totalArea / tileArea);
  const totalBox = Math.ceil(totalTiles / perbox);
  const totalInBox = totalBox * perbox;
  const leftover = totalInBox - totalTiles;
  const leftoverArea = leftover * tileArea;
  const totalPrice = totalBox * priceBox;

  document.getElementById("total-area").textContent = totalArea.toFixed(2);
  document.getElementById("total-tiles").textContent = totalTiles;
  document.getElementById("total-box").textContent = totalBox;
  document.getElementById("total-in-box").textContent = totalInBox;
  document.getElementById("leftover-tiles").textContent = leftover + " pcs";
  document.getElementById("leftover-area").textContent =
    leftoverArea.toFixed(4) + " m²";

  document.getElementById("detail-rows").innerHTML = `
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
    <span class="row-label text-left uppercase text-warnakedua">
    Luas 1 keping tile
    </span>
    <span class="row-value text-right text-warnautama">
    ${tileArea.toFixed(4)} m² (${tw}×${th} cm)
    </span>
    </div>
    
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
    <span class="row-label text-left uppercase text-warnakedua">
    Luas area yang akan dipasang tile
    </span>
    <span class="row-value text-right text-warnautama">
    ${area.toFixed(2)} m²
    </span>
    </div>

    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
    <span class="row-label text-left uppercase text-warnakedua">  
    Penambahan waste ${waste}%
    </span>
    <span class="row-value text-right text-warnautama">
    +${((area * waste) / 100).toFixed(2)} m²
    </span>
    </div>
    
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
    <span class="row-label text-left uppercase text-warnakedua">
    Total area yang dibutuhkan
    </span>
    <span class="row-value text-right text-warnautama">
    ${totalArea.toFixed(2)} m²
    </span>
    </div>

    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
    <span class="row-label text-left uppercase text-warnakedua">
    Jumlah keping tile yang dibutuhkan 
    </span>
    <span class="row-value text-right text-warnautama">
    ${totalTiles} keping
    </span>
    </div>
    
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
    <span class="row-label text-left uppercase text-warnakedua">
    Hitungan per box yang dibutuhkan (${totalTiles} ÷ ${perbox} keping/box)
    </span>
    <span class="row-value text-right text-warnautama">
    ${totalBox} box → ${totalInBox} keping
    </span>
    </div>
    
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
    <span class="row-label text-left uppercase text-warnakedua">
    Sisa (${totalInBox} − ${totalTiles})
    </span>
    <span class="row-value text-right text-warnautama">
    ${leftover} keping (${leftoverArea.toFixed(4)} m²)
    </span>
    </div>
  `;

  const ps = document.getElementById("price-section");
  if (priceBox > 0) {
    ps.style.display = "block";
    document.getElementById("total-price").textContent = fmt(totalPrice);
    document.getElementById("price-calc-note").textContent =
      `${totalBox} box × ${fmt(priceBox)}`;
  } else {
    ps.style.display = "none";
  }
}

// Reset all input fields and result display to initial state
function resetAll() {
  ["area", "waste", "tw", "th", "perbox"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("price-box").value = "";
  document.getElementById("price-m2").value = "";
  document.getElementById("error-msg").textContent = "";
  document.getElementById("result-section").style.display = "none";
}
