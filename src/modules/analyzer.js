const { fileInformation } = require("./state");

/**
 * Анализирует собранные данные, ищет популярный формат и фильтрует JAR
 * @returns {Object} Объект, содержащий массив найденных jarFiles
 */
function analyzeData() {
    const jarFiles = fileInformation.files.filter(file => file.extension === "jar");
    
    fileInformation.totalJarSize = jarFiles.reduce((acc, file) => acc + file.size, 0);

    for (const format in fileInformation.fileFormatObject) {
        const count = fileInformation.fileFormatObject[format];
        if (count > fileInformation.popularCount) {
            fileInformation.popularCount = count;
            fileInformation.popularFormat = format;
        }
    }

    return { jarFiles };
}

module.exports = { 
    analyzeData 
};