const http = require('node:http');
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser');
const { parse } = require('node-html-parser');

async function getFeed(url) {
    let data = '';
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', function () {
                resolve(data)
            });
        }).on('error', (e) => {
            reject(e)
        });
    });
}

async function run() {
    const xml = await getFeed('http://feeds.rucast.net/radio-t');
    const parser = new XMLParser();
    const xmlObj = parser.parse(xml);
    const latestRelease = xmlObj.rss.channel.item[0];
    const parsedDesc = parse(latestRelease['itunes:summary']);
    const showNotes = [];
    let link = ''
    for (const el of parsedDesc.childNodes) {
        if (el.tagName === 'UL') {
            for (const li of el.childNodes ) {
                if (li.text.trim()) {
                    showNotes.push(li.text.trim())
                }
            }
        }
        if (el.tagName === 'AUDIO') {
            link = el.getAttribute('src');
        }
    }
    console.log(`showNotes:  `, showNotes);
    console.log(`link:  `, link);
}

run();

