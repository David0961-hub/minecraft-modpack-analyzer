const fs = require("fs");
const path = require("path");
const { fileInformation } = require("./state");

/**
 * Рекурсивно сканирует директорию и собирает информацию о файлах
 * @param {string} dirPath - Путь к папке
 * @param {number} currentDepth - Текущая глубина вложенности
 */
function scanDirectory(dirPath, currentDepth = 0) {
    if (currentDepth > fileInformation.maxDepth) {
        fileInformation.maxDepth = currentDepth;
    }
    try {
        const countResult = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const result of countResult) {
            const fullPath = path.join(dirPath, result.name);
            
            try {
                const information = fs.statSync(fullPath);

                if (result.isFile()) {
                    fileInformation.totalFiles++;
                    fileInformation.totalSize += information.size;
                    
                    let getFormatFromFile = path.extname(result.name).slice(1).toLowerCase();
                    if (getFormatFromFile === "") {
                        getFormatFromFile = "no-extension";
                    }
                    if (!fileInformation.fileFormatObject[getFormatFromFile]) {
                        fileInformation.fileFormatObject[getFormatFromFile] = 0;
                    }
                    fileInformation.fileFormatObject[getFormatFromFile]++;

                    const fileData = {
                        name: result.name,
                        path: fullPath,
                        size: information.size,
                        extension: getFormatFromFile,
                    };

                    fileInformation.files.push(fileData);

                    if (information.size > fileInformation.largestFileSize) {
                        fileInformation.largestFile = result.name;
                        fileInformation.largestFileSize = information.size;
                    }
                } else if (result.isDirectory()) {
                    fileInformation.totalFolder++;
                    scanDirectory(fullPath, currentDepth + 1);
                }
            } catch (e) {
                console.warn(`⚠️ Не удалось прочитать объект: ${fullPath}`);
            }
        }
    } catch (e) {
        console.warn(`⚠️ Нет доступа к директории: ${dirPath}`);
    }
}

module.exports = {
    scanDirectory
};