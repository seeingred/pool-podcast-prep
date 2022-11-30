const { XMLParser } = require('fast-xml-parser');
const { parse } = require('node-html-parser');
const fs = require('fs');
const path = require('node:path');
const { createInterface } = require('readline');
const { downloadFeed, downloadFile } = require('./requests');
const cut = require('./cut');
const speed = require('./speed');
const copy = require('./copy');

async function run() {
    console.log(`This script will download latest Radio-T podcast, trim it and increase its speed`);
    const baseName = 'downloads/';
    const xml = await downloadFeed('http://feeds.rucast.net/radio-t');
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

    const fullName = baseName + fileName;

    console.log(`Show notes:  `, showNotes);

    const readline = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const readLineAsync = (msg) => {
        return new Promise((resolve) => {
            readline.question(msg, (userRes) => {
                resolve(userRes);
            });
        });
    };
    const seekInput = await readLineAsync('Trim from (H:MM or M) [0]: ');
    const destInput = await readLineAsync('Copy destination [/Volumes/Untitled/]: ');
    readline.close();

    if (!fs.existsSync(fullName)) {
        await downloadFile(link, fullName);
    } else {
        console.log(`${fullName} exists, skipping download.`);
    }
    
    let currentName = fullName;
    if (seekInput) {
        let seek = 0;
        if (seekInput.indexOf(':') >= 0) {
            const seekInputValues = seekInput.split(':').map((v) => parseInt(v));
            seek = seekInputValues[0] * 3600 + seekInputValues[1] * 60;
        } else if (parseInt(seekInput) > 0) {
            seek = parseInt(seekInput);
        }
        if (seek) {
            currentName = baseName + 'cut.mp3';
            cut(seek, fullName, baseName + 'cut.mp3');
        }
    }

    const lastName = baseName + 'speed.mp3';
    await speed(currentName, lastName);
    // const lastName = currentName;

    let dest = '/Volumes/Untitled/';
    if (destInput.trim()) {
        dest = destInput.trim();
    }

    for (const file of await fs.promises.readdir(dest)) {
        try {
            await fs.promises.unlink(path.join(dest, file));
        } catch (err) {}
    }

    await copy(lastName, dest + fileName);

}

run();
