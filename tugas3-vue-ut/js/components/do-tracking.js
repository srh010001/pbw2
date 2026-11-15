/* Komponen pencarian dan monitoring status perjalanan Delivery Order. */
Vue.component("do-tracking", {
    template: "#tpl-do-tracking",
    props: {
        trackingList: { type: Object, required: true }
    },
    data: function () {
        return {
            searchQuery: "",
            hasSearched: false,
            progressDrafts: {},
            statusDrafts: {},
            statusOptions: ["Dalam Proses", "Dalam Perjalanan", "Kendala","Telah Diterima/Terkirim"]
        };
    },
    computed: {
        foundItems: function () {
            const query = this.searchQuery.trim().toLowerCase();
            if (!query || !this.hasSearched) return [];
            return Object.keys(this.trackingList).map(nomorDO => {
                return Object.assign({ nomorDO: nomorDO }, this.trackingList[nomorDO]);
            }).filter(item => {
                return item.nomorDO.toLowerCase().includes(query) || String(item.nim || "").toLowerCase().includes(query);
            });
        }
    },
    methods: {
        search: function () {
            this.hasSearched = true;
        },
        clearSearch: function () {
            this.searchQuery = "";
            this.hasSearched = false;
            this.progressDrafts = {};
            this.statusDrafts = {};
        },
        formatRupiah: function (value) {
            return "Rp " + Number(value || 0).toLocaleString("id-ID");
        },
        formatTanggal: function (value) {
            return window.SittaAPI.formatWIBDate(value);
        },
        formatWaktu: function (value) {
            return window.SittaAPI.formatWIBDateTime(value);
        },
        timelineTerbaru: function (items) {
            return Array.isArray(items) ? items.slice().reverse() : [];
        },
        statusDraft: function (item) {
            return this.statusDrafts[item.nomorDO] || item.status || "Dalam Proses";
        },
        changeStatusDraft: function (nomorDO, value) {
            this.$set(this.statusDrafts, nomorDO, value);
        },
        addProgress: function (item) {
            const nomorDO = item.nomorDO;
            const keterangan = String(this.progressDrafts[nomorDO] || "").trim();
            if (!keterangan) {
                if (window.Swal) Swal.fire({ icon: "warning", title: "Keterangan belum diisi", text: "Masukkan keterangan progress terlebih dahulu." });
                return;
            }
            this.$emit("add-progress", {
                nomorDO: nomorDO,
                status: this.statusDraft(item),
                progress: {
                    waktu: window.SittaAPI.getWIBDateTime(),
                    keterangan: keterangan
                }
            });
            this.$set(this.progressDrafts, nomorDO, "");
        }
    }
});