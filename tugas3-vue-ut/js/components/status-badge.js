/* Komponen status stok. Catatan HTML tampil sebagai tooltip saat mouse hover. */
Vue.component("status-badge", {
    template: "#tpl-status-badge",
    props: {
        item: { type: Object, required: true }
    },
    data: function () {
        return { hovered: false };
    },
    computed: {
        statusText: function () {
            if (Number(this.item.qty) === 0) return "Kosong";
            if (Number(this.item.qty) < Number(this.item.safety)) return "Menipis";
            return "Aman";
        },
        statusClass: function () {
            if (Number(this.item.qty) === 0) return "status-empty";
            if (Number(this.item.qty) < Number(this.item.safety)) return "status-low";
            return "status-safe";
        },
        statusIcon: function () {
            if (Number(this.item.qty) === 0) return "fa-solid fa-circle-xmark";
            if (Number(this.item.qty) < Number(this.item.safety)) return "fa-solid fa-triangle-exclamation";
            return "fa-solid fa-circle-check";
        },
        safeCatatan: function () {
            // Menjaga format HTML dasar, tetapi membuang tag dan atribut aktif yang berisiko.
            const source = String(this.item.catatanHTML || "Tidak ada catatan");
            const parsed = new DOMParser().parseFromString("<div>" + source + "</div>", "text/html");
            const allowedTags = ["EM", "STRONG", "B", "I", "U", "BR"];
            const output = document.createElement("div");

            function copySafe(node, target) {
                Array.from(node.childNodes).forEach(function (child) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        target.appendChild(document.createTextNode(child.textContent));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        if (allowedTags.indexOf(child.tagName) >= 0) {
                            const clean = document.createElement(child.tagName.toLowerCase());
                            copySafe(child, clean);
                            target.appendChild(clean);
                        } else {
                            copySafe(child, target);
                        }
                    }
                });
            }

            copySafe(parsed.body.firstChild, output);
            return output.innerHTML || "Tidak ada catatan";
        }
    }
});