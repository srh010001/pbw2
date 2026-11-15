/* Komponen formulir Delivery Order untuk paket atau beberapa bahan ajar satuan. */
Vue.component("order-form", {
    template: "#tpl-order-form",
    props: {
        trackingList: { type: Object, required: true },
        pengirimanList: { type: Array, required: true },
        paketList: { type: Array, required: true },
        stokList: { type: Array, required: true }
    },
    data: function () {
        return {
            newDO: {
                nim: "", nama: "", alamatPengiriman: "", ekspedisi: "",
                jenisPesanan: "paket", paket: "", tanggalKirim: window.SittaAPI.getWIBDate(), items: []
            },
            formError: ""
        };
    },
    computed: {
        selectedPaket: function () {
            return this.paketList.find(item => item.kode === this.newDO.paket) || null;
        },
        isiPaketTerpilih: function () {
            if (!this.selectedPaket) return [];
            return this.selectedPaket.isi.map(kode => this.stokList.find(item => item.kode === kode)).filter(Boolean);
        },
        selectedItemRows: function () {
            return this.newDO.items.map((line, index) => {
                const bahan = this.stokList.find(item => item.kode === line.kode) || null;
                return {
                    index: index,
                    kode: line.kode,
                    qty: Number(line.qty) || 0,
                    bahan: bahan,
                    subtotal: bahan ? Number(bahan.harga) * (Number(line.qty) || 0) : 0
                };
            });
        },
        detailPesanan: function () {
            if (this.newDO.jenisPesanan === "paket") {
                return this.isiPaketTerpilih.map(bahan => ({
                    kode: bahan.kode, judul: bahan.judul, qty: 1, satuan: "eksemplar",
                    hargaSatuan: Number(bahan.harga) || 0, subtotal: Number(bahan.harga) || 0
                }));
            }
            return this.selectedItemRows.filter(row => row.bahan).map(row => ({
                kode: row.bahan.kode, judul: row.bahan.judul, qty: row.qty, satuan: "eksemplar",
                hargaSatuan: Number(row.bahan.harga) || 0, subtotal: row.subtotal
            }));
        },
        totalHarga: function () {
            if (this.newDO.jenisPesanan === "paket") return this.selectedPaket ? Number(this.selectedPaket.harga) : 0;
            return this.detailPesanan.reduce((total, item) => total + Number(item.subtotal || 0), 0);
        },
        nextNomorDO: function () {
            const year = window.SittaAPI.getWIBYear();
            const prefix = "DO" + year + "-";
            let maxSequence = 0;
            Object.keys(this.trackingList).forEach(function (nomor) {
                if (nomor.indexOf(prefix) !== 0) return;
                const sequence = Number(nomor.slice(prefix.length));
                if (Number.isFinite(sequence) && sequence > maxSequence) maxSequence = sequence;
            });
            return prefix + String(maxSequence + 1).padStart(4, "0");
        },
        jamWIB: function () {
            const parts = window.SittaAPI.getWIBParts(new Date());
            return parts.hour + ":" + parts.minute;
        }
    },
    methods: {
        formatRupiah: function (value) {
            return "Rp " + Number(value || 0).toLocaleString("id-ID");
        },
        labelEkspedisi: function (item) {
            const nama = String(item.nama || "").replace("Ekspres", "Express");
            return "JNE " + nama;
        },
        setJenisPesanan: function (jenis) {
            this.newDO.jenisPesanan = jenis;
            this.formError = "";
            if (jenis === "satuan" && this.newDO.items.length === 0) this.addItemLine();
        },
        addItemLine: function () {
            this.newDO.items.push({ kode: "", qty: 1 });
        },
        removeItemLine: function (index) {
            this.newDO.items.splice(index, 1);
        },
        isKodeDipilih: function (kode, currentIndex) {
            return this.newDO.items.some((line, index) => index !== currentIndex && line.kode === kode);
        },
        stockQuantity: function (kode) {
            const item = this.stokList.find(row => row.kode === kode);
            return item ? Number(item.qty) : 999999;
        },
        validateOrder: function () {
            if (!/^\d{5,20}$/.test(this.newDO.nim)) return "NIM harus terdiri dari 5 sampai 20 digit angka.";
            if (!this.newDO.nama.trim()) return "Nama penerima wajib diisi.";
            if (!this.newDO.alamatPengiriman.trim()) return "Alamat pengiriman wajib diisi lengkap.";
            if (!this.newDO.ekspedisi || !this.newDO.tanggalKirim) return "Ekspedisi dan tanggal kirim wajib dipilih.";

            if (this.newDO.jenisPesanan === "paket") {
                if (!this.selectedPaket) return "Pilih paket bahan ajar yang tersedia.";
                const missing = this.selectedPaket.isi.filter(kode => {
                    const item = this.stokList.find(row => row.kode === kode);
                    return !item || Number(item.qty) < 1;
                });
                if (missing.length) return "Stok paket tidak mencukupi untuk bahan: " + missing.join(", ") + ".";
                return "";
            }

            if (!this.newDO.items.length) return "Tambahkan minimal satu bahan ajar.";
            const seen = {};
            for (const line of this.newDO.items) {
                if (!line.kode) return "Pilih bahan ajar pada setiap baris.";
                if (seen[line.kode]) return "Bahan ajar yang sama hanya boleh ditambahkan satu kali. Ubah jumlah pada baris tersebut.";
                seen[line.kode] = true;
                if (!Number.isInteger(Number(line.qty)) || Number(line.qty) < 1) return "Jumlah setiap bahan ajar minimal 1 eksemplar.";
                const item = this.stokList.find(row => row.kode === line.kode);
                if (!item) return "Data bahan ajar " + line.kode + " tidak ditemukan.";
                if (Number(line.qty) > Number(item.qty)) return "Stok " + item.kode + " hanya tersedia " + item.qty + " eksemplar.";
            }
            return "";
        },
        submitOrder: function () {
            this.formError = this.validateOrder();
            if (this.formError) return;

            const ekspedisiDipilih = this.pengirimanList.find(item => item.kode === this.newDO.ekspedisi);
            const waktuDibuat = window.SittaAPI.getWIBDateTime();
            const pesanan = {
                nomorDO: this.nextNomorDO,
                nim: this.newDO.nim,
                nama: this.newDO.nama,
                alamatPengiriman: this.newDO.alamatPengiriman.trim(),
                status: "Dalam Proses",
                ekspedisi: ekspedisiDipilih ? this.labelEkspedisi(ekspedisiDipilih) : this.newDO.ekspedisi,
                tanggalKirim: this.newDO.tanggalKirim,
                jenisPesanan: this.newDO.jenisPesanan,
                paket: this.newDO.jenisPesanan === "paket" ? this.selectedPaket.kode : "Bahan Ajar Satuan",
                namaPaket: this.newDO.jenisPesanan === "paket" ? this.selectedPaket.nama : "Bahan Ajar Satuan",
                detailPesanan: this.detailPesanan.map(item => Object.assign({}, item)),
                total: Number(this.totalHarga),
                createdAt: waktuDibuat,
                updatedAt: waktuDibuat,
                perjalanan: []
            };
            this.$emit("create-order", pesanan);
            this.resetForm();
        },
        submitWithEnter: function (event) {
            if (event && event.target && event.target.tagName === "TEXTAREA") return;
            if (event) event.preventDefault();
            this.submitOrder();
        },
        resetForm: function () {
            this.newDO = {
                nim: "", nama: "", alamatPengiriman: "", ekspedisi: "",
                jenisPesanan: "paket", paket: "", tanggalKirim: window.SittaAPI.getWIBDate(), items: []
            };
            this.formError = "";
        }
    }
});