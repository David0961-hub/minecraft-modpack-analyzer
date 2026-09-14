const AdmZip = require("adm-zip");
const path = require("path");

/**
 * Открывает JAR-файл как архив и собирает базовую статистику содержимого
 * @param {string} filePath - Абсолютный путь к jar-файлу
 * @returns {Object} Результат анализа со статистикой или ошибкой
 */
function analyzeJar(filePath) {
    try {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();

        const stats = {
            fileCount: 0,
            dirCount: 0,
            extensions: {},
            hasMetaInf: false,
            hasFabricJson: false,
            hasModsToml: false,
            hasMcmodInfo: false
        };

        for (const entry of zipEntries) {
            const entryName = entry.entryName;

            if (entry.isDirectory) {
                stats.dirCount++;
                continue;
            }

            stats.fileCount++;

            if (entryName.startsWith("META-INF/")) stats.hasMetaInf = true;
            if (entryName === "fabric.mod.json") stats.hasFabricJson = true;
            if (entryName === "mods.toml") stats.hasModsToml = true;
            if (entryName === "mcmod.info") stats.hasMcmodInfo = true;

            let ext = path.extname(entryName).toLowerCase();
            if (ext === "") ext = "no-extension";
            
            if (!stats.extensions[ext]) {
                stats.extensions[ext] = 0;
            }
            stats.extensions[ext]++;
        }

        return { success: true, stats };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

module.exports = {
    analyzeJar
};