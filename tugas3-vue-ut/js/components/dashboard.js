/* Komponen ringkasan dashboard stok, Delivery Order, dan perubahan tracking. */
Vue.component("sitta-dashboard", {
    template: "#tpl-dashboard",
    props: {
        stok: { type: Array, required: true },
        trackingList: { type: Object, required: true }
    },
    computed: {
        stockSummary: function () {
            const result = { totalJenis: this.stok.length, totalQty: 0, tersedia: 0, menipis: 0, kosong: 0 };
            this.stok.forEach(function (item) {
                const qty = Number(item.qty) || 0;
                const safety = Number(item.safety) || 0;
                result.totalQty += qty;
                if (qty <= 0) result.kosong += 1;
                else if (qty <= safety) result.menipis += 1;
                else result.tersedia += 1;
            });
            return result;
        },
        orderSummary: function () {
            const orders = Object.keys(this.trackingList).map(nomorDO => this.withNumber(nomorDO));
            return {
                total: orders.length,
                aktif: orders.filter(item => item.status !== "Terkirim").length,
                terkirim: orders.filter(item => item.status === "Terkirim").length
            };
        },
        latestOrders: function () {
            return Object.keys(this.trackingList).map(nomorDO => this.withNumber(nomorDO))
                .sort((a, b) => this.orderTimestamp(b) - this.orderTimestamp(a))
                .slice(0, 5);
        },
        latestTracking: function () {
            return Object.keys(this.trackingList).map(nomorDO => this.withNumber(nomorDO))
                .sort((a, b) => this.trackingTimestamp(b) - this.trackingTimestamp(a))
                .slice(0, 5);
        },
        lowStockItems: function () {
            return this.stok.filter(item => Number(item.qty) <= Number(item.safety) || Number(item.qty) <= 0)
                .slice().sort((a, b) => Number(a.qty) - Number(b.qty));
        }
    },
    methods: {
        withNumber: function (nomorDO) {
            return Object.assign({ nomorDO: nomorDO }, this.trackingList[nomorDO] || {});
        },
        lastProgress: function (item) {
            const rows = Array.isArray(item.perjalanan) ? item.perjalanan : [];
            return rows.length ? rows[rows.length - 1] : null;
        },
        orderTimestamp: function (item) {
            const value = item.createdAt || item.tanggalKirim || "1970-01-01";
            const parsed = new Date(String(value).replace(" ", "T")).getTime();
            return Number.isNaN(parsed) ? 0 : parsed;
        },
        trackingTimestamp: function (item) {
            const last = this.lastProgress(item);
            const value = item.updatedAt || (last && last.waktu) || item.createdAt || item.tanggalKirim || "1970-01-01";
            const parsed = new Date(String(value).replace(" ", "T")).getTime();
            return Number.isNaN(parsed) ? 0 : parsed;
        },
        formatTanggal: function (value) {
            if (!value) return "-";
            return String(value).length > 10
                ? window.SittaAPI.formatWIBDateTime(value)
                : window.SittaAPI.formatWIBDate(value);
        },
        statusClass: function (status) {
            if (status === "Terkirim") return "status-safe";
            if (status === "Kendala") return "status-empty";
            return "status-low";
        },
        orderLabel: function (item) {
            return item.jenisPesanan === "satuan" ? "Bahan Ajar Satuan" : (item.namaPaket || item.paket || "Paket Bahan Ajar");
        },
        stockClass: function (item) {
            const qty = Number(item.qty) || 0;
            if (qty <= 0) return "status-empty";
            if (qty <= Number(item.safety)) return "status-low";
            return "status-safe";
        },
        stockLabel: function (item) {
            const qty = Number(item.qty) || 0;
            if (qty <= 0) return "Stok kosong";
            if (qty <= Number(item.safety)) return "Menipis";
            return "Tersedia";
        }
    }
});