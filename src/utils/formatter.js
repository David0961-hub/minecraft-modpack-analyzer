/**
 * Умное форматирование размера файлов.
 * Автоматически переводит байты в Bytes, KB, MB или GB в зависимости от веса.
 * @param {number} bytes - Размер в байтах
 * @returns {string} - Красивая строка ( например, "42.53 KB" или "12.40 MB" )
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    formatFileSize
};
