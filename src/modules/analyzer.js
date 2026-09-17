// Импортируем объект fileInformation из state.js
const { fileInformation } = require("./state");

/**
 * Анализирует собранные данные, ищет популярный формат,
 * фильтрует JAR и выполняет строгую проверку зависимостей модов.
 * @returns {Object} Объект с массивом jarFiles и отчетом о проверке зависимостей
 */
function analyzeData() {
    // 1. Фильтруем файлы, оставляя только расширение "jar"
    const jarFiles = fileInformation.files.filter(file => file.extension === "jar");
    
    // 2. Считаем общий размер всех JAR-файлов
    fileInformation.totalJarSize = jarFiles.reduce((acc, file) => acc + file.size, 0);

    // 3. Высчитываем самый популярный формат в модпаке
    for (const format in fileInformation.fileFormatObject) {
        const count = fileInformation.fileFormatObject[format];
        if (count > fileInformation.popularCount) {
            fileInformation.popularCount = count;
            fileInformation.popularFormat = format;
        }
    }

    // ==================================================
    // 🛠️ ЛОГИКА ПРОВЕРКИ ЗАВИСИМОСТЕЙ (ВЫПОЛНЕНИЕ ТЗ)
    // ==================================================
    
    // Создаем структуру для быстрого поиска установленных модов по их ID
    const installedMods = {};

    // Заполняем её виртуальными заглушками (базовые зависимости Minecraft)
    installedMods["minecraft"] = true;
    installedMods["fabricloader"] = true;
    installedMods["fabric"] = true;
    installedMods["fabric-api"] = true;

    // Сначала проходим по всем модам и записываем их реальные ID в базу
    jarFiles.forEach(file => {
        if (file.stats && file.stats.id) {
            installedMods[file.stats.id.toLowerCase()] = true;
        }
    });

    const dependencyReport = {
        totalChecked: 0,
        missingCount: 0,
        problematicModsCount: 0,
        details: [] // Тут будут лежать отчеты для каждого мода
    };

    // Теперь проверяем зависимости каждого мода
    jarFiles.forEach(file => {
        if (!file.stats) return;

        const modId = file.stats.id;
        const modName = file.stats.name;
        const dependencies = file.stats.dependencies || {};
        const depKeys = Object.keys(dependencies);

        // Нам интересны только те моды, у которых прописаны зависимости
        if (depKeys.length === 0) return;

        dependencyReport.totalChecked++;
        
        const modResults = {
            name: modName,
            id: modId,
            status: "OK",
            checks: [] // Результаты по каждой зависимости
        };

        let hasProblem = false;

        depKeys.forEach(depId => {
            const cleanDepId = depId.toLowerCase();
            
            // Проверяем, есть ли такой ID в нашей базе установленных модов
            if (cleanDepId in installedMods) {
                modResults.checks.push({ depId: depId, status: "OK" });
            } else {
                modResults.checks.push({ depId: depId, status: "ERROR", message: `отсутствует: ${depId}` });
                dependencyReport.missingCount++;
                hasProblem = true;
            }
        });

        if (hasProblem) {
            modResults.status = "PROBLEM";
            dependencyReport.problematicModsCount++;
        }

        dependencyReport.details.push(modResults);
    });

    // Возвращаем объект, как у тебя и было задумано + новый отчет
    return { 
        jarFiles,
        dependencyReport
    };
}

module.exports = { 
    analyzeData 
};
