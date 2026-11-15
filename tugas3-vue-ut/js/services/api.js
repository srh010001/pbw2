/* =========================================================
   DATA SERVICE SITTA-UT
   Memuat JSON, menyiapkan template Vue, dan menyimpan salinan kerja.
   Tidak menggunakan database/server backend.
   ========================================================= */
(function () {
    "use strict";

    const STORAGE_KEY = "sitta_ut_tugas3_working_data_v1";
    const COVER_MIGRATION_KEY = "sitta_ut_cover_mapping_user_images_v1";
    const TIME_ZONE = "Asia/Jakarta"; // WIB sesuai lokasi kerja proyek.

    function deepCopy(value) {
        return JSON.parse(JSON.stringify(value));
    }

    /*
       File JSON terlampir memiliki tracking berbentuk array berisi objek.
       Setiap objek memiliki satu properti nomor DO. Di file contoh,
       DO2025-0001 muncul dua kali dengan data yang sama. Fungsi ini
       menormalkannya menjadi object dengan nomor DO sebagai key agar
       satu nomor DO hanya ditampilkan satu kali.
    */
    function normalizeTracking(rawTracking) {
        const result = {};
        if (Array.isArray(rawTracking)) {
            rawTracking.forEach(function (row) {
                if (!row || typeof row !== "object") return;
                Object.keys(row).forEach(function (nomorDO) {
                    if (!result[nomorDO]) result[nomorDO] = deepCopy(row[nomorDO]);
                });
            });
            return result;
        }

        if (rawTracking && typeof rawTracking === "object") {
            Object.keys(rawTracking).forEach(function (nomorDO) {
                result[nomorDO] = deepCopy(rawTracking[nomorDO]);
            });
        }
        return result;
    }

    async function loadData() {
        const response = await fetch("data/dataBahanAjar.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error("File data/dataBahanAjar.json tidak dapat dibaca. Jalankan proyek melalui Live Server.");
        }

        const json = await response.json();
        return {
            upbjjList: Array.isArray(json.upbjjList) ? json.upbjjList : [],
            kategoriList: Array.isArray(json.kategoriList) ? json.kategoriList : [],
            pengirimanList: Array.isArray(json.pengirimanList) ? json.pengirimanList : [],
            paket: Array.isArray(json.paket) ? json.paket : [],
            stok: Array.isArray(json.stok) ? json.stok : [],
            tracking: normalizeTracking(json.tracking)
        };
    }

    async function loadTemplates(templateNames) {
        const tasks = templateNames.map(async function (name) {
            const response = await fetch("templates/" + name + ".html", { cache: "no-store" });
            if (!response.ok) throw new Error("Template " + name + ".html tidak ditemukan.");

            const markup = await response.text();
            const templateId = "tpl-" + name;
            const existing = document.getElementById(templateId);
            if (existing) existing.remove();

            const templateNode = document.createElement("script");
            templateNode.type = "text/x-template";
            templateNode.id = templateId;
            templateNode.innerHTML = markup;
            document.body.appendChild(templateNode);
        });
        await Promise.all(tasks);
    }

    function loadScript(source) {
        return new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = source;
            script.onload = resolve;
            script.onerror = function () { reject(new Error("Gagal memuat " + source)); };
            document.body.appendChild(script);
        });
    }

    function getWIBParts(date) {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: TIME_ZONE,
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hourCycle: "h23"
        }).formatToParts(date || new Date());
        const result = {};
        parts.forEach(function (part) {
            if (part.type !== "literal") result[part.type] = part.value;
        });
        return result;
    }

    function getWIBDate() {
        const p = getWIBParts(new Date());
        return p.year + "-" + p.month + "-" + p.day;
    }

    function getWIBDateTime() {
        const p = getWIBParts(new Date());
        return p.year + "-" + p.month + "-" + p.day + " " + p.hour + ":" + p.minute + ":" + p.second;
    }

    function getWIBYear() {
        return getWIBParts(new Date()).year;
    }

    function formatWIBDate(value) {
        if (!value) return "-";
        let date;
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            // Tanggal kalender dari input date dipertahankan tanpa pergeseran zona waktu.
            date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
        } else {
            date = new Date(value);
        }
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat("id-ID", {
            timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric"
        }).format(date);
    }

    function formatWIBDateTime(value) {
        if (!value) return "-";
        const match = String(value).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
        if (match) return formatWIBDate(match[1]) + " pukul " + match[2] + " WIB";
        return String(value);
    }

    function getWorkingCopy(masterData) {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : null;
            const working = {
                upbjjList: deepCopy(masterData.upbjjList),
                kategoriList: deepCopy(masterData.kategoriList),
                pengirimanList: deepCopy(masterData.pengirimanList),
                paket: deepCopy(masterData.paket),
                stok: parsed && Array.isArray(parsed.stok) ? deepCopy(parsed.stok) : deepCopy(masterData.stok),
                tracking: parsed && parsed.tracking ? normalizeTracking(parsed.tracking) : deepCopy(masterData.tracking)
            };

            /* Migrasi satu kali untuk memasangkan sampul awal pada data stok lama.
               Jika pengguna sudah memilih sampul sendiri, pilihan tersebut tetap dipertahankan. */
            if (!localStorage.getItem(COVER_MIGRATION_KEY)) {
                const masterByCode = {};
                masterData.stok.forEach(function (item) {
                    masterByCode[item.kode] = item;
                });
                working.stok.forEach(function (item) {
                    const masterItem = masterByCode[item.kode];
                    if (masterItem && masterItem.gambar && !item.gambar) {
                        item.gambar = masterItem.gambar;
                    }
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    stok: working.stok,
                    tracking: working.tracking
                }));
                localStorage.setItem(COVER_MIGRATION_KEY, "1");
            }

            return working;
        } catch (error) {
            console.warn("Penyimpanan lokal tidak dapat dibaca; menggunakan JSON awal.", error);
            return deepCopy(masterData);
        }
    }

    function saveWorkingCopy(stok, tracking) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                stok: stok,
                tracking: tracking
            }));
        } catch (error) {
            console.warn("Data tidak dapat disimpan ke localStorage.", error);
        }
    }

    window.SittaAPI = {
        TIME_ZONE: TIME_ZONE,
        loadData: loadData,
        loadTemplates: loadTemplates,
        loadScript: loadScript,
        normalizeTracking: normalizeTracking,
        getWorkingCopy: getWorkingCopy,
        saveWorkingCopy: saveWorkingCopy,
        getWIBParts: getWIBParts,
        getWIBDate: getWIBDate,
        getWIBDateTime: getWIBDateTime,
        getWIBYear: getWIBYear,
        formatWIBDate: formatWIBDate,
        formatWIBDateTime: formatWIBDateTime
    };
})();