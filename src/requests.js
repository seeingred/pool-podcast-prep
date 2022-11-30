const http = require('node:http');
const https = require('node:https'); // or 'https' for https:// URLs
const fs = require('fs');
async function downloadFeed(url) {
    let data = '';
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', function () {
                resolve(data);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}

function downloadFile(url, fileName) {
    const file = fs.createWriteStream(fileName);
    const getFileRec = (link, resolve, reject) => {
        https
            .get(link, (res) => {
                let len = 0;
                let downloaded = 0;
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return getFileRec(res.headers.location, resolve, reject);
                } else {
                    len = parseInt(res.headers['content-length'], 10);
                    res.pipe(file);
                }

                res.on('data', function (chunk) {
                    downloaded += chunk.length;
                    process.stdout.write(
                        `Downloading to "${fileName}" (${(len / 1000000).toFixed(2)} MB):   ` +
                            ((100.0 * downloaded) / len).toFixed(2) +
                            '% ' +
                            (downloaded / 1000000).toFixed(2) +
                            ' MB' +
                            '\r'
                    );
                });

                file.on('finish', () => {
                    file.close();
                    process.stdout.write('\n');
                    resolve();
                });
            })
            .on('error', (e) => {
                reject(e);
            });
    };
    return new Promise((resolve, reject) => getFileRec(url, resolve, reject));
}

module.exports = { downloadFeed, downloadFile };