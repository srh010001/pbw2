/* Komponen modal konfirmasi yang dapat digunakan kembali. */
Vue.component("app-modal", {
    template: "#tpl-app-modal",
    props: {
        show: { type: Boolean, default: false },
        title: { type: String, default: "Konfirmasi" },
        message: { type: String, default: "Apakah Anda yakin?" }
    }
});