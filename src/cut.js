const MP3Cutter = require('mp3-cutter');

async function cut(seek, inputFile, outputFile) {
    MP3Cutter.cut({
        src: inputFile,
        target: outputFile,
        start: seek, 
    });
}

module.exports = cut;
