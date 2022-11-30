
const fs = require('fs');

async function copy(source, target) {
    const fileSize = (await fs.promises.stat(source)).size;
    let bytesCopied = 0;
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(source);
        readStream.on('data', (buffer) => {
            bytesCopied += buffer.length;
            let percent = (bytesCopied / fileSize) * 100;
            if (percent == 100) {
                percent = 99
            }
            process.stdout.write(`Copying: ${percent.toFixed(2)}% \r`);
        });
        readStream.on('err', () => {
            process.stdout.write('\n');
            reject();
        });
        const writeStream = fs.createWriteStream(target)
        writeStream.on('err', () => {
            process.stdout.write('\n');
            reject();
        })
        writeStream.on('end', () => {
            process.stdout.write('\n');
            // process.stdout.write(`Copying: ${(100).toFixed(2)}% \n`);
            resolve();
        });
        readStream.pipe(writeStream);
    });
}

module.exports = copy;