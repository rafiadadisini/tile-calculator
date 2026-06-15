// Menyimpan informasi field harga mana yang terakhir kali diubah oleh pengguna ("box" atau "m2")
let lastEditedPriceField = "box";

// Membaca nilai integer bersih dari string input (menghapus semua non-digit)
function parseRaw(el) {
  const digits = (el.value || "").replace(/\D/g, "");
  return parseInt(digits) || 0;
}

// Memformat angka menjadi format ribuan Indonesia, mendukung opsi menampilkan angka 0
function formatCurrency(n, showZero = false) {
  if (n === 0) return showZero ? "0" : "";
  return n.toLocaleString("id-ID");
}

// Memformat angka menjadi Rupiah untuk tampilan hasil dengan awalan "Rp "
function fmt(n) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

// Menangani ketikan pengguna pada input harga (formatting ribuan secara realtime)
function onCurrencyInput(el) {
  const digits = (el.value || "").replace(/\D/g, "");
  const raw = parseInt(digits) || 0;
  const pos = el.selectionStart;
  const prevLen = el.value.length;
  
  // Tampilkan angka "0" jika ada ketikan nol, atau kosong jika benar-benar kosong
  el.value = digits.length > 0 ? formatCurrency(raw, true) : "";
  
  const diff = el.value.length - prevLen;
  try {
    // Pengaman: pastikan posisi kursor baru tidak bernilai negatif
    const newPos = Math.max(0, pos + diff);
    el.setSelectionRange(newPos, newPos);
  } catch (e) {}
}

// Menangani perilaku ketika input harga menerima fokus (diklik/tab)
function onCurrencyFocus(el) {
  // Sembunyikan placeholder sementara agar kursor tidak menimpa angka nol bayangan
  el.placeholder = "";

  // Jika nilai saat ini adalah "0", kosongkan nilai agar placeholder bersih muncul
  if (el.value === "0") {
    el.value = "";
  } else if (el.value !== "") {
    // Jika berisi harga lain, seleksi seluruh teks untuk mempermudah pengetikan ulang
    el.select();
  }
}

// Menangani ketika input harga kehilangan fokus (blur)
function onCurrencyBlur(el, side) {
  // Kembalikan placeholder "0" ketika fokus berpindah keluar
  el.placeholder = "0";

  const digits = (el.value || "").replace(/\D/g, "");
  const raw = parseInt(digits) || 0;
  el.value = digits.length > 0 ? formatCurrency(raw, true) : "";
  
  // Rekam field harga yang terakhir diubah oleh user secara manual
  lastEditedPriceField = side;
  
  // Sinkronkan field harga pasangannya dan hitung ulang totalnya
  syncPrice(side);
  calc();
}

// Mengatur nilai input rupiah secara dinamis
function setCurrencyValue(id, n) {
  document.getElementById(id).value = n ? formatCurrency(n, true) : "";
}

// Mensinkronkan nilai harga per box dan harga per m² secara timbal balik
function syncPrice(from) {
  const tw = parseFloat(document.getElementById("tw").value) || 0;
  const th = parseFloat(document.getElementById("th").value) || 0;
  const perbox = parseInt(document.getElementById("perbox").value) || 1;
  const tileArea = (tw / 100) * (th / 100);
  const boxArea = tileArea * perbox;
  
  // Pengaman: Jangan lakukan sinkronisasi jika dimensi ubin belum valid (0) agar input tidak hilang
  if (boxArea <= 0) return;

  if (from === "box") {
    const pb = parseRaw(document.getElementById("price-box"));
    setCurrencyValue("price-m2", Math.round(pb / boxArea));
  } else {
    const pm2 = parseRaw(document.getElementById("price-m2"));
    setCurrencyValue("price-box", Math.round(pm2 * boxArea));
  }
}

// Memvalidasi nilai input utama sebelum kalkulasi dijalankan secara resmi
function validate() {
  const area = parseFloat(document.getElementById("area").value);
  const tw = parseFloat(document.getElementById("tw").value);
  const th = parseFloat(document.getElementById("th").value);
  const pb = parseInt(document.getElementById("perbox").value);
  
  if (!area || area <= 0) return "Luas area harus diisi dan lebih dari 0.";
  if (!tw || tw <= 0) return "Ukuran panjang tile harus diisi.";
  if (!th || th <= 0) return "Ukuran lebar tile harus diisi.";
  if (!pb || pb <= 0) return "Jumlah keping per box harus diisi.";
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

// Melakukan perhitungan kebutuhan ubin dan merender hasilnya ke halaman HTML
function calc() {
  // Bersihkan angka nol di depan pada input number sebelum melakukan perhitungan
  ["area", "waste", "tw", "th", "perbox"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = el.value.replace(/^0+(?=\d)/, "");
    }
  });

  const area = parseFloat(document.getElementById("area").value) || 0;
  const waste = parseFloat(document.getElementById("waste").value) || 0;
  const tw = parseFloat(document.getElementById("tw").value) || 0;
  const th = parseFloat(document.getElementById("th").value) || 0;
  const perbox = parseInt(document.getElementById("perbox").value) || 0;

  // Lakukan sinkronisasi harga secara otomatis berdasarkan input harga terakhir yang diubah
  syncPrice(lastEditedPriceField);

  const priceBox = parseRaw(document.getElementById("price-box"));

  const tileArea = (tw / 100) * (th / 100);
  const totalArea = area * (1 + waste / 100);
  
  // Inisialisasi nilai aman
  let totalTiles = 0;
  let totalBox = 0;
  let totalInBox = 0;
  let leftover = 0;
  let leftoverArea = 0;
  let totalPrice = 0;

  // Pengaman: Hanya hitung jika luas tile dan isi box valid (di atas 0)
  if (tileArea > 0) {
    totalTiles = Math.ceil(totalArea / tileArea);
    if (perbox > 0) {
      totalBox = Math.ceil(totalTiles / perbox);
      totalInBox = totalBox * perbox;
      leftover = totalInBox - totalTiles;
      leftoverArea = leftover * tileArea;
      totalPrice = totalBox * priceBox;
    }
  }

  // Render metrik hasil ke elemen DOM
  document.getElementById("total-area").textContent = totalArea.toFixed(2);
  document.getElementById("total-tiles").textContent = totalTiles;
  document.getElementById("total-box").textContent = totalBox;
  document.getElementById("total-in-box").textContent = totalInBox;
  document.getElementById("leftover-tiles").textContent = leftover + " pcs";
  document.getElementById("leftover-area").textContent = leftoverArea.toFixed(4) + " m²";

  // Render baris rincian perhitungan detail
  document.getElementById("detail-rows").innerHTML = `
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
      <span class="row-label text-left uppercase text-warnakedua">Luas 1 keping tile</span>
      <span class="row-value text-right text-warnautama">${tileArea.toFixed(4)} m² (${tw}×${th} cm)</span>
    </div>
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
      <span class="row-label text-left uppercase text-warnakedua">Luas area yang akan dipasang tile</span>
      <span class="row-value text-right text-warnautama">${area.toFixed(2)} m²</span>
    </div>
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
      <span class="row-label text-left uppercase text-warnakedua">Penambahan waste ${waste}%</span>
      <span class="row-value text-right text-warnautama">+${((area * waste) / 100).toFixed(2)} m²</span>
    </div>
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
      <span class="row-label text-left uppercase text-warnakedua">Total area yang dibutuhkan</span>
      <span class="row-value text-right text-warnautama">${totalArea.toFixed(2)} m²</span>
    </div>
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
      <span class="row-label text-left uppercase text-warnakedua">Jumlah keping tile yang dibutuhkan</span>
      <span class="row-value text-right text-warnautama">${totalTiles} keping</span>
    </div>
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
      <span class="row-label text-left uppercase text-warnakedua">Hitungan per box yang dibutuhkan (${totalTiles} ÷ ${perbox} keping/box)</span>
      <span class="row-value text-right text-warnautama">${totalBox} box → ${totalInBox} keping</span>
    </div>
    <div class="row grid grid-cols-2 border-b-2 border-warnakedua p-2">
      <span class="row-label text-left uppercase text-warnakedua">Sisa (${totalInBox} − ${totalTiles})</span>
      <span class="row-value text-right text-warnautama">${leftover} keping (${leftoverArea.toFixed(4)} m²)</span>
    </div>
  `;

  // Render bagian harga total belanja jika harga box terisi
  const ps = document.getElementById("price-section");
  if (priceBox > 0) {
    ps.style.display = "block";
    document.getElementById("total-price").textContent = fmt(totalPrice);
    document.getElementById("price-calc-note").textContent = `${totalBox} box × ${fmt(priceBox)}`;
  } else {
    ps.style.display = "none";
  }
}

// Mengembalikan seluruh isian form input dan antarmuka hasil ke kondisi awal
function resetAll() {
  ["area", "waste", "tw", "th", "perbox"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
  document.getElementById("price-box").value = "";
  document.getElementById("price-m2").value = "";
  document.getElementById("error-msg").textContent = "";
  document.getElementById("result-section").style.display = "none";
  lastEditedPriceField = "box"; // Reset state pelacak harga terakhir
}
