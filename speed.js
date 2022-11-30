const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg');

async function speed(inputFile, outputFile) {
    const tempo = 1.5;
    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .audioFilters(['atempo=' + tempo])
            .output(outputFile)
            .on('progress', function (progress) {
                process.stdout.write(`Encoding: ${(progress.percent * tempo).toFixed(2)}% \r`);
            })
            .on('error', (err) => {
                reject(err);
            })
            .on('end', () => {
                process.stdout.write('\n');
                resolve();
            })
            .run();
    });
}

module.exports = speed;
