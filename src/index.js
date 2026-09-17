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
const targetFolder = './test-modpack/RAD 1.56';

// 1. Шаг: Сканируем директорию
scanDirectory(targetFolder);

// 2. Шаг: Обрабатываем статистику и получаем список модов + отчет о зависимостях
const { jarFiles: finalJars, dependencyReport } = analyzeData();

// Строка-накопитель для файла отчетности
let outputText = "";
function log(message) {
    outputText += message + "\n";
}

// ==================================================
// 1. ПОДРОБНЫЙ СПИСОК СТРУКТУРЫ КАЖДОГО JAR-МОДА
// ==================================================
log("=== ДЕТАЛЬНЫЙ АНАЛИЗ СТРУКТУРЫ JAR ФАЙЛОВ ===");
log("--------------------------------------------------");

finalJars.forEach((jarFile, index) => {
    log(`[${index + 1}] Мод: ${jarFile.name}`);
    log(`    Размер: ${formatFileSize(jarFile.size)}`);
    log(`    Путь: ${jarFile.path}`);
    log(`    Чтение структуры архива...`);

    const jarAnalysis = analyzeJar(jarFile.path);

    if (!jarAnalysis.success) {
        log(`    [ОШИБКА] Не удалось открыть файл: архив поврежден! (${jarAnalysis.error})`);
        log("--------------------------------------------------");
        return; 
    }

    const { stats } = jarAnalysis;
    log(`    Внутренняя статистика:`);
    log(`       Папок внутри:  ${stats.dirCount}`);
    log(`       Файлов внутри: ${stats.fileCount}`);
    
    log(`    Маркеры платформы:`);
    log(`       META-INF:      ${stats.hasMetaInf ? "Обнаружен" : "Отсутствует"}`);
    log(`       Fabric Json:   ${stats.hasFabricJson ? "Да (Платформа: Fabric)" : "Нет"}`);
    log(`       Forge Toml:    ${stats.hasModsToml ? "Да (Платформа: Forge 1.13+)" : "Нет"}`);
    log(`       Legacy Forge:  ${stats.hasMcmodInfo ? "Да (Платформа: Forge Old)" : "Нет"}`);

    log(`    Внутренние форматы файлов:`);
    const extensionsEntries = Object.entries(stats.extensions);
    if (extensionsEntries.length === 0) {
        log("       (файлы отсутствуют)");
    } else {
        for (const [extension, count] of extensionsEntries) {
            log(`       • [${extension.toUpperCase()}] - ${count} шт.`);
        }
    }
    log("--------------------------------------------------");
});


// ==================================================
// 2. ПРОВЕРКА ЗАВИСИМОСТЕЙ МОДОВ (ПО ТЗ)
// ==================================================
log("\n=================================");
log("      ПРОВЕРКА ЗАВИСИМОСТЕЙ      ");
log("=================================");

if (dependencyReport.details.length === 0) {
    log("В установленных модах не найдено прописанных зависимостей.");
} else {
    dependencyReport.details.forEach(mod => {
        log(`Мод: ${mod.name}`);
        log(`ID: ${mod.id}`);
        log(`\nЗависимости:`);
        
        mod.checks.forEach(check => {
            if (check.status === "OK") {
                log(`  [OK] ${check.depId}`);
            } else {
                log(`  [ERROR] ${check.message}`);
            }
        });
        log("---------------------------------");
    });
}

log("Итого по зависимостям:");
log(`  Модов проверено: ${dependencyReport.totalChecked}`);
log(`  Отсутствующих зависимостей: ${dependencyReport.missingCount}`);
log(`  Модов с проблемами: ${dependencyReport.problematicModsCount}`);


// ==================================================
// 3. СВОДНЫЙ ОТЧЕТ ПО МОДПАКУ (ЧЕЛОВЕЧНЫЙ СТИЛЬ)
// ==================================================
log("\n=================================");
log("    ФИНАЛЬНЫЙ ОТЧЕТ АНАЛИЗА      ");
log("=================================");
log(`Всего файлов найдено : ${fileInformation.totalFiles}`);
log(`Всего папок         : ${fileInformation.totalFolder}`);
log(`Максимальная вложенность папок: ${fileInformation.maxDepth}`);
log(`Общий размер директории: ${formatFileSize(fileInformation.totalSize)}`);

log(`\nСамый большой файл в сборке:`);
log(`  Название: ${fileInformation.largestFile}`);
log(`  Размер: ${formatFileSize(fileInformation.largestFileSize)}`);

log("---------------------------------");
log("Распределение по форматам в папке:");
for (const format in fileInformation.fileFormatObject) {
    const count = fileInformation.fileFormatObject[format];
    log(`  [${format.toUpperCase()}] - ${count} шт.`);
}

log(`\nСамый популярный формат файлов: ${fileInformation.popularFormat.toUpperCase()} (${fileInformation.popularCount} файлов)`);

log(`=================================`);
log(`ОБЩИЙ ИТОГ: Найдено JAR-модов: ${finalJars.length}`);
log(`Суммарный вес всех JAR-файлов: ${formatFileSize(fileInformation.totalJarSize)}`);

if (dependencyReport.missingCount === 0) {
    log(`[OK] Отсутствующие зависимости не найдены.`);
} else {
    log(`[WARNING] Найдены отсутствующие зависимости! Проверьте список выше.`);
}
log(`=================================`);

log("\nАнализ модпака успешно завершен.");

// Запись файла отчета на диск
fs.writeFileSync(path.join(__dirname, "../output.txt"), outputText, "utf8");

console.log("Анализ завершен. Строгий отчет без кракозябр успешно записан в файл output.txt в корне проекта.");