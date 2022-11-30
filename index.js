const http = require('node:http');
const { XMLParser } = require('fast-xml-parser');
const { parse } = require('node-html-parser');
const https = require('node:https'); // or 'https' for https:// URLs
const fs = require('fs');

async function getFeed(url) {
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

function getFile(url, fileName) {
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
                    process.stdout.write(`Downloading to "${fileName}" (${(len / 1000000).toFixed(2)} MB):   ` + ((100.0 * downloaded) / len).toFixed(2) + '% ' + (downloaded / 1000000).toFixed(2) + ' MB' + '\r');
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

async function run() {
    const xml = await getFeed('http://feeds.rucast.net/radio-t');
    const parser = new XMLParser();
    const xmlObj = parser.parse(xml);
    const latestRelease = xmlObj.rss.channel.item[0];
    const parsedDesc = parse(latestRelease['itunes:summary']);
    const showNotes = [];
    let link = '';
    for (const el of parsedDesc.childNodes) {
        if (el.tagName === 'UL') {
            for (const li of el.childNodes) {
                if (li.text.trim()) {
                    showNotes.push(li.text.trim());
                }
            }
        }
        if (el.tagName === 'AUDIO') {
            link = el.getAttribute('src');
        }
    }
    const fileName = link.split('/')[link.split('/').length - 1];
    const fullName = 'downloads/' + fileName;
    if (!fs.existsSync(fullName)) {
        await getFile(link, fullName);
    } else {
        console.log(`${fullName} exists, skipping download.`)
    }
    console.log(`Show notes:  `, showNotes);

    // after download completed close filestream
}

run();
