// Daftar Barang Umum Sekolah
const MASTER_INVENTARIS = [
  { nama: "Proyektor Epson", stok: 5 },
  { nama: "Layar Proyektor", stok: 5 },
  { nama: "Kabel HDMI 5m", stok: 10 },
  { nama: "Speaker Aktif", stok: 3 },
  { nama: "Kamera DSLR", stok: 2 },
  { nama: "Laptop Operasional", stok: 8 },
  { nama: "Mikrofon Wireless", stok: 6 },
];

let databasePeminjaman = JSON.parse(localStorage.getItem("LOG_PINJAM")) || [];
let stokSaatIni =
  JSON.parse(localStorage.getItem("STOK_AKTUAL")) || MASTER_INVENTARIS;

function inisialisasi() {
  renderPilihanBarang();
  renderStok();
  renderTabel();
}

function renderPilihanBarang() {
  const select = document.getElementById("selectBarang");
  select.innerHTML = '<option value="">-- Pilih Inventaris --</option>';
  stokSaatIni.forEach((item) => {
    if (item.stok > 0) {
      let opt = document.createElement("option");
      opt.value = item.nama;
      opt.innerText = `${item.nama} (${item.stok})`;
      select.appendChild(opt);
    }
  });
}

function renderStok() {
  const list = document.getElementById("stokList");
  list.innerHTML = "";
  stokSaatIni.forEach((item) => {
    list.innerHTML += `<li>${item.nama} <b>${item.stok} unit</b></li>`;
  });
}

function prosesTambah() {
  const namaBarang = document.getElementById("selectBarang").value;
  const peminjam = document.getElementById("inputPeminjam").value;

  if (!namaBarang || !peminjam)
    return alert("Mohon pilih barang dan isi nama peminjam!");

  const waktuSekarang = new Date();

  // Kurangi Stok
  const indexStok = stokSaatIni.findIndex((i) => i.nama === namaBarang);
  stokSaatIni[indexStok].stok--;

  // Simpan Log
  databasePeminjaman.unshift({
    id: Date.now(),
    barang: namaBarang,
    peminjam: peminjam,
    waktuPinjam: waktuSekarang.toLocaleString("id-ID"),
    timestampPinjam: waktuSekarang.getTime(),
    waktuKembali: "-",
    durasi: "-",
    status: "Aktif",
  });

  simpanDanSegarkan();
  document.getElementById("inputPeminjam").value = "";
}

function toggleKembali(id) {
  const index = databasePeminjaman.findIndex((d) => d.id === id);
  const data = databasePeminjaman[index];

  if (data.status === "Selesai") return;

  const waktuKembali = new Date();
  const selisihMs = waktuKembali.getTime() - data.timestampPinjam;

  // Hitung Durasi (Menit/Jam)
  const menit = Math.floor(selisihMs / 60000);
  const jam = Math.floor(menit / 60);
  const durasiTeks =
    jam > 0 ? `${jam} Jam ${menit % 60} Menit` : `${menit} Menit`;

  // Update Data
  data.waktuKembali = waktuKembali.toLocaleString("id-ID");
  data.durasi = durasiTeks;
  data.status = "Selesai";

  // Tambah Stok Kembali
  const indexStok = stokSaatIni.findIndex((i) => i.nama === data.barang);
  stokSaatIni[indexStok].stok++;

  simpanDanSegarkan();
}

function simpanDanSegarkan() {
  localStorage.setItem("LOG_PINJAM", JSON.stringify(databasePeminjaman));
  localStorage.setItem("STOK_AKTUAL", JSON.stringify(stokSaatIni));
  renderPilihanBarang();
  renderStok();
  renderTabel();
}

function renderTabel(dataFilter = null) {
  const data = dataFilter || databasePeminjaman;
  const tbody = document.getElementById("badanTabel");
  tbody.innerHTML = "";

  data.forEach((item) => {
    tbody.innerHTML += `
            <tr>
                <td><b>${item.barang}</b></td>
                <td>${item.peminjam}</td>
                <td><span class="time-info">${item.waktuPinjam}</span></td>
                <td><span class="time-info">${item.waktuKembali}</span></td>
                <td class="duration">${item.durasi}</td>
                <td><span class="status-badge ${item.status === "Aktif" ? "pinjam" : "kembali"}">${item.status}</span></td>
                <td>
                    ${item.status === "Aktif" ? `<button onclick="toggleKembali(${item.id})" class="btn-action">✅ Kembalikan</button>` : "Selesai"}
                    <button onclick="hapusData(${item.id})" style="color:red; border:none; background:none; cursor:pointer; margin-left:10px;">🗑️</button>
                </td>
            </tr>
        `;
  });
}

function hapusData(id) {
  if (confirm("Hapus catatan ini?")) {
    databasePeminjaman = databasePeminjaman.filter((d) => d.id !== id);
    simpanDanSegarkan();
  }
}

function filterTabel() {
  const key = document.getElementById("pencarian").value.toLowerCase();
  const hasil = databasePeminjaman.filter(
    (d) =>
      d.barang.toLowerCase().includes(key) ||
      d.peminjam.toLowerCase().includes(key),
  );
  renderTabel(hasil);
}

// === FUNGSI EKSPOR ===
function unduhPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "mm", "a4"); // 'l' untuk landscape agar tabel lebar muat
  doc.text("LAPORAN PEMINJAMAN INVENTARIS", 14, 15);
  doc.autoTable({ html: "#tabelLog", margin: { top: 25 } });
  doc.save("Laporan_Inventaris_Waktu.pdf");
}

function unduhExcel() {
  const worksheet = XLSX.utils.json_to_sheet(databasePeminjaman);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Log");
  XLSX.writeFile(workbook, "Data_Peminjaman_Sekolah.xlsx");
}
