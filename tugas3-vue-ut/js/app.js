/* =========================================================
   ROOT VUE SITTA-UT
   Tab pada root: dashboard | stok | tracking | order.
   ========================================================= */
(function () {
    "use strict";

    const api = window.SittaAPI;
    const templateNames = ["dashboard", "stock-table", "do-tracking", "order-form", "status-badge", "app-modal"];
    const componentScripts = [
        "js/components/dashboard.js",
        "js/components/status-badge.js",
        "js/components/app-modal.js",
        "js/components/stock-table.js",
        "js/components/do-tracking.js",
        "js/components/order-form.js"
    ];

    async function startApplication() {
        const masterData = await api.loadData();
        await api.loadTemplates(templateNames);
        for (const source of componentScripts) await api.loadScript(source);

        const workingData = api.getWorkingCopy(masterData);

        new Vue({
            el: "#app",
            data: function () {
                return {
                    tab: "dashboard",
                    isLoading: false,
                    namaPengguna: localStorage.getItem("namaUser") || "Sarah Hanifah",
                    upbjjList: workingData.upbjjList,
                    kategoriList: workingData.kategoriList,
                    pengirimanList: workingData.pengirimanList,
                    paketList: workingData.paket,
                    stok: workingData.stok,
                    trackingList: workingData.tracking,
                    clockNow: new Date(),
                    clockTimer: null
                };
            },
            computed: {
                salam: function () {
                    const hour = Number(api.getWIBParts(this.clockNow).hour);
                    if (hour >= 4 && hour < 11) return "Selamat Pagi";
                    if (hour >= 11 && hour < 15) return "Selamat Siang";
                    if (hour >= 15 && hour < 18) return "Selamat Sore";
                    return "Selamat Malam";
                },
                jamWIB: function () {
                    const p = api.getWIBParts(this.clockNow);
                    return p.hour + ":" + p.minute + ":" + p.second;
                },
                tanggalWIB: function () {
                    return api.formatWIBDate(api.getWIBDate());
                }
            },
            watch: {
                /* Watcher 1: setiap perubahan stok disimpan ke penyimpanan browser. */
                stok: {
                    deep: true,
                    handler: function () {
                        this.persistData();
                    }
                },
                /* Watcher 2: setiap perubahan data tracking disimpan ke penyimpanan browser. */
                trackingList: {
                    deep: true,
                    handler: function () {
                        this.persistData();
                    }
                }
            },
            created: function () {
                const self = this;
                this.clockTimer = window.setInterval(function () {
                    self.clockNow = new Date();
                }, 1000);
            },
            beforeDestroy: function () {
                if (this.clockTimer) window.clearInterval(this.clockTimer);
            },
            methods: {
                persistData: function () {
                    api.saveWorkingCopy(this.stok, this.trackingList);
                },
                tambahStok: function (item) {
                    this.stok.push(item);
                    if (window.Swal) Swal.fire({ icon: "success", title: "Stok ditambahkan", text: item.kode + " berhasil dimasukkan ke daftar.", timer: 1800, showConfirmButton: false });
                },
                ubahStok: function (item) {
                    const index = this.stok.findIndex(row => row.kode === item.kode);
                    if (index !== -1) this.$set(this.stok, index, item);
                    if (window.Swal) Swal.fire({ icon: "success", title: "Data diperbarui", timer: 1500, showConfirmButton: false });
                },
                hapusStok: function (kode) {
                    const index = this.stok.findIndex(row => row.kode === kode);
                    if (index !== -1) {
                        this.stok.splice(index, 1);
                        if (window.Swal) Swal.fire({ icon: "success", title: "Data dihapus", text: kode + " berhasil dihapus.", timer: 1500, showConfirmButton: false });
                    }
                },
                buatOrder: function (pesanan) {
                    if (this.trackingList[pesanan.nomorDO]) {
                        if (window.Swal) Swal.fire({ icon: "error", title: "Nomor DO sudah digunakan", text: "Silakan buat ulang nomor DO." });
                        return;
                    }

                    /* Validasi ulang stok di root sebelum transaksi disimpan. */
                    const rincian = Array.isArray(pesanan.detailPesanan) ? pesanan.detailPesanan : [];
                    const kekurangan = [];
                    rincian.forEach(detail => {
                        const item = this.stok.find(row => row.kode === detail.kode);
                        if (!item || Number(item.qty) < Number(detail.qty)) {
                            kekurangan.push(detail.kode);
                        }
                    });
                    if (kekurangan.length) {
                        if (window.Swal) Swal.fire({ icon: "error", title: "Stok tidak mencukupi", text: "Stok bahan ajar berikut tidak mencukupi: " + kekurangan.join(", ") + "." });
                        return;
                    }

                    /* Setiap DO mengurangi stok sesuai jumlah eksemplar yang dipesan. */
                    rincian.forEach(detail => {
                        const item = this.stok.find(row => row.kode === detail.kode);
                        if (item) this.$set(item, "qty", Number(item.qty) - Number(detail.qty));
                    });
                    this.$set(this.trackingList, pesanan.nomorDO, pesanan);
                    this.tab = "tracking";
                    if (window.Swal) Swal.fire({ icon: "success", title: "Delivery Order berhasil dibuat", text: pesanan.nomorDO + " tersimpan dan stok bahan ajar telah diperbarui." });
                },
                tambahProgress: function (payload) {
                    const data = this.trackingList[payload.nomorDO];
                    if (!data) return;
                    if (!Array.isArray(data.perjalanan)) this.$set(data, "perjalanan", []);
                    data.perjalanan.push(payload.progress);
                    if (payload.status) this.$set(data, "status", payload.status);
                    else if (data.status === "Dalam Proses") this.$set(data, "status", "Dalam Perjalanan");
                    this.$set(data, "updatedAt", api.getWIBDateTime());
                    if (window.Swal) Swal.fire({ icon: "success", title: "Tracking diperbarui", text: "Status dan riwayat perjalanan berhasil diperbarui.", timer: 1600, showConfirmButton: false });
                }
            }
        });
    }

    startApplication().catch(function (error) {
        console.error("SITTA-UT gagal dijalankan:", error);
        const box = document.getElementById("boot-error");
        box.style.display = "block";
        box.textContent = "Aplikasi belum dapat dimuat: " + error.message + " Pastikan folder proyek dibuka melalui VS Code Live Server dan koneksi internet tersedia untuk CDN.";
    });
})();