/* CATATAN - KOMPONEN STOK BAHAN AJAR
   Komponen ini menampilkan tabel stok, filter, pengurutan, formulir tambah/edit,
   pemilihan sampul, validasi, dan konfirmasi hapus.
*/
/* Komponen daftar dan pengelolaan stok bahan ajar. */
Vue.component("ba-stock-table", {
    template: "#tpl-stock-table",
    props: {
        stok: { type: Array, required: true },
        upbjjList: { type: Array, required: true },
        kategoriList: { type: Array, required: true }
    },
    data: function () {
        return {
            selectedUpbjj: "",
            selectedKategori: "",
            stockCondition: "semua",
            sortBy: "",
            newItem: this.emptyItem(),
            editItemData: null,
            editIndex: null,
            formError: "",
            editError: "",
            showDeleteModal: false,
            deleteTarget: null,
            /* Sampul yang diberikan pengguna, dipasangkan dengan judul stok JSON.
               Sampul Pengantar Ilmu Komunikasi disediakan sebagai opsi tambahan
               karena tidak ada stok dengan judul komunikasi pada data awal. */
            coverItems: [
                { title: "Pengantar Manajemen - EKMA4116", image: "assets/img/pengantar_manajemen.png" },
                { title: "Pengantar Akuntansi - EKMA4115", image: "assets/img/pengantar_akutansi.jpg" },
                { title: "Biologi Umum (Praktikum) - BIOL4201", image: "assets/img/biologi_umum.jpg" },
                { title: "Dasar-Dasar Sosiologi - FISIP4001", image: "assets/img/dasar-dasar_sosiologi.jpg" },
                { title: "Pengantar Ilmu Komunikasi - SKOM4101", image: "assets/img/pengantar_komunikasi.jpg" },
                { title: "Mikrobiologi - BIOL4223", image: "assets/img/mikrobiologi.jpg" },
                { title: "Paud Perkembangan - PAUD4306", image: "assets/img/paud_perkembangan.jpg" },
                { title: "Pemrograman Berbasis Web - STSI4209", image: "assets/img/Pemrograman Berbasis Web.jpeg" },
                { title: "Kepemimpinan - ADPU4334", image: "assets/img/kepemimpinan.jpg" },
                { title: "Manajemen Keuangan - EKMA4123", image: "assets/img/manajemen_keuangan.jpg" }
            ]
        };
    },
    computed: {
        kategoriListFiltered: function () {
            if (!this.selectedUpbjj) return [];
            const kategoriDiLokasi = this.stok
                .filter(item => item.upbjj === this.selectedUpbjj)
                .map(item => item.kategori);
            return this.kategoriList.filter(kategori => kategoriDiLokasi.indexOf(kategori) >= 0);
        },
        filteredData: function () {
            let result = this.stok.filter(item => {
                const cocokLokasi = !this.selectedUpbjj || item.upbjj === this.selectedUpbjj;
                const cocokKategori = !this.selectedKategori || item.kategori === this.selectedKategori;
                let cocokKondisi = true;
                if (this.stockCondition === "reorder") cocokKondisi = Number(item.qty) < Number(item.safety);
                if (this.stockCondition === "kosong") cocokKondisi = Number(item.qty) === 0;
                return cocokLokasi && cocokKategori && cocokKondisi;
            });

            if (this.sortBy) {
                result = result.slice().sort((a, b) => {
                    if (this.sortBy === "judul") return String(a.judul).localeCompare(String(b.judul), "id");
                    return Number(a[this.sortBy]) - Number(b[this.sortBy]);
                });
            }
            return result;
        },
        deleteMessage: function () {
            return this.deleteTarget
                ? "Data " + this.deleteTarget.kode + " - " + this.deleteTarget.judul + " akan dihapus dari daftar stok."
                : "Data bahan ajar akan dihapus.";
        }
    },
    watch: {
        /* Watcher 1: ketika UT-Daerah berubah, kategori lama direset. */
        selectedUpbjj: function () {
            this.selectedKategori = "";
        },
        /* Watcher 2: kategori selalu dikosongkan bila belum memilih UT-Daerah. */
        selectedKategori: function (value) {
            if (!this.selectedUpbjj && value) this.selectedKategori = "";
        }
    },
    methods: {
        emptyItem: function () {
            return {
                kode: "", judul: "", kategori: "", upbjj: "", lokasiRak: "",
                harga: "", qty: "", safety: "", catatanHTML: "", gambar: ""
            };
        },
        formatRupiah: function (value) {
            return "Rp " + Number(value || 0).toLocaleString("id-ID");
        },
        validateItem: function (item) {
            if (!item.kode || !item.judul || !item.kategori || !item.upbjj || !item.lokasiRak) {
                return "Kode, judul, kategori, UT-Daerah, dan lokasi rak wajib diisi.";
            }
            if (!Number.isFinite(Number(item.harga)) || Number(item.harga) < 0) return "Harga harus berupa angka nol atau lebih.";
            if (!Number.isInteger(Number(item.qty)) || Number(item.qty) < 0) return "Jumlah stok harus berupa bilangan bulat nol atau lebih.";
            if (!Number.isInteger(Number(item.safety)) || Number(item.safety) < 0) return "Safety stock harus berupa bilangan bulat nol atau lebih.";
            return "";
        },
        addItem: function () {
            this.formError = this.validateItem(this.newItem);
            if (this.formError) return;

            const kode = this.newItem.kode.toUpperCase();
            if (this.stok.some(item => String(item.kode).toUpperCase() === kode)) {
                this.formError = "Kode mata kuliah sudah terdaftar. Gunakan kode yang berbeda.";
                return;
            }

            const item = {
                kode: kode,
                judul: this.newItem.judul,
                kategori: this.newItem.kategori,
                upbjj: this.newItem.upbjj,
                lokasiRak: this.newItem.lokasiRak,
                harga: Number(this.newItem.harga),
                qty: Number(this.newItem.qty),
                safety: Number(this.newItem.safety),
                catatanHTML: this.newItem.catatanHTML || "Tidak ada catatan",
                gambar: this.newItem.gambar || ""
            };
            this.$emit("create-item", item);
            this.newItem = this.emptyItem();
            this.formError = "";
        },
        submitWithEnter: function (event) {
            if (event && event.target && event.target.tagName === "TEXTAREA") return;
            if (event) event.preventDefault();
            this.addItem();
        },
        openEdit: function (item) {
            this.editIndex = this.stok.findIndex(row => row.kode === item.kode);
            this.editItemData = JSON.parse(JSON.stringify(item));
            if (!this.editItemData.gambar) this.$set(this.editItemData, "gambar", "");
            this.editError = "";
        },
        saveEdit: function () {
            if (this.editIndex === null || !this.editItemData) return;
            this.editError = this.validateItem(this.editItemData);
            if (this.editError) return;
            const item = Object.assign({}, this.editItemData, {
                harga: Number(this.editItemData.harga),
                qty: Number(this.editItemData.qty),
                safety: Number(this.editItemData.safety)
            });
            this.$emit("update-item", item);
            this.cancelEdit();
        },
        submitEditWithEnter: function (event) {
            if (event && event.target && event.target.tagName === "TEXTAREA") return;
            if (event) event.preventDefault();
            this.saveEdit();
        },
        cancelEdit: function () {
            this.editItemData = null;
            this.editIndex = null;
            this.editError = "";
        },
        askDelete: function (item) {
            this.deleteTarget = item;
            this.showDeleteModal = true;
        },
        confirmDelete: function () {
            if (this.deleteTarget) this.$emit("delete-item", this.deleteTarget.kode);
            this.showDeleteModal = false;
            this.deleteTarget = null;
        },
        resetFilter: function () {
            this.selectedUpbjj = "";
            this.selectedKategori = "";
            this.stockCondition = "semua";
            this.sortBy = "";
        }
    }
});