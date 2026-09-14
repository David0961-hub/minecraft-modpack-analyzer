const path = require("path");
const fs = require("fs"); 

// Подключаем модули из папки modules
const { fileInformation } = require("./modules/state");
const { scanDirectory } = require("./modules/scanner");
const { analyzeData } = require("./modules/analyzer");
const { analyzeJar } = require("./modules/scanJar");

// Подключаем утилиты из папки utils
const { formatFileSize } = require("./utils/formatter");

// Задаем целевую папку для сканирования
const targetFolder = './test-modpack';

// 1. Шаг: Сканируем директорию
scanDirectory(targetFolder);

// 2. Шаг: Обрабатываем статистику и получаем список модов
const { jarFiles: finalJars } = analyzeData();

// Строка-накопитель для файла
let outputText = "";
function log(message) {
    outputText += message + "\n";
}

log("=================================");
log(" ⛏️  MINECRAFT MODPACK ANALYZER  ");
log("=================================");
log(` Всего файлов найдено : ${fileInformation.totalFiles}`);
log(` Всего папок         : ${fileInformation.totalFolder}`);
log(` Макс. вложенность   : ${fileInformation.maxDepth}`);
log(`\n Общий размер        : ${formatFileSize(fileInformation.totalSize)}`);

log(`\n 🔴 САМЫЙ БОЛЬШОЙ ФАЙЛ В СБОРКЕ: \n 👉 ${fileInformation.largestFile} \n ⚖️  Размер: ${formatFileSize(fileInformation.largestFileSize)}`);

log("---------------------------------");
log(" Распределение по форматам в папке:");

for (const format in fileInformation.fileFormatObject) {
    const count = fileInformation.fileFormatObject[format];
    log(`   • [${format.toUpperCase()}] - ${count} шт.`);
}
log(`\n Самый popular формат: \n ${fileInformation.popularFormat.toUpperCase()} - ${fileInformation.popularCount} файлов.`);

log(`\n=================================`);
log(` 📦 ИТОГО НАЙДЕНО JAR-МОДОВ: ${finalJars.length}`);
log(` Общий размер всех JAR: ${formatFileSize(fileInformation.totalJarSize)}`);
log(`=================================`);
log("\n Начинаем глубокий анализ каждого мода...\n");
log("---------------------------------\n");

finalJars.forEach((jarFile, index) => {
    log(`[${index + 1}] Мод: ${jarFile.name}`);
    log(`    ⚖️  Размер: ${formatFileSize(jarFile.size)}`);
    log(`    ⚡ Чтение структуры архива...`);

    const jarAnalysis = analyzeJar(jarFile.path);

    if (!jarAnalysis.success) {
        log(`    ❌ Ошибка открытия: Файл поврежден! (${jarAnalysis.error})`);
        log("---------------------------------");
        return; 
    }

    const { stats } = jarAnalysis;
    log(`    📊 Статистика содержимого:`);
    log(`       • Папок внутри:  ${stats.dirCount}`);
    log(`       • Файлов внутри: ${stats.fileCount}`);
    
    log(`    🧩 Маркеры платформы:`);
    log(`       • META-INF:      ${stats.hasMetaInf ? "✅ Есть" : "❌ Нет"}`);
    log(`       • Fabric Json:   ${stats.hasFabricJson ? "✅ Да (Fabric)" : "❌ Нет"}`);
    log(`       • Forge Toml:    ${stats.hasModsToml ? "✅ Да (Forge 1.13+)" : "❌ Нет"}`);
    log(`       • Legacy Forge:  ${stats.hasMcmodInfo ? "✅ Да (Forge Old)" : "❌ Нет"}`);

    log(`    🗂️  Внутренние форматы (Object.entries):`);
    
    const extensionsEntries = Object.entries(stats.extensions);
    if (extensionsEntries.length === 0) {
        log("       (файлы отсутствуют)");
    } else {
        for (const [extension, count] of extensionsEntries) {
            log(`       • [${extension.toUpperCase()}] - ${count} шт.`);
        }
    }
    log("---------------------------------");
});

log("\n🏁 Глубокий анализ модпака успешно завершен!");

// Запись файла в корневую директорию
fs.writeFileSync(path.join(__dirname, "../output.txt"), outputText, "utf8");

console.log("🚀 Анализ завершен! Сводный отчет и детальный список сохранены в output.txt в корне проекта.");