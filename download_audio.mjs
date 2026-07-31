import https from 'https';
import fs from 'fs';
import path from 'path';

const dir = './public/audio';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        if(fs.existsSync(dest)){
            console.log(`Skipping ${dest}... already exists`);
            return resolve();
        }
        console.log(`Downloading ${dest}...`);
        const file = fs.createWriteStream(dest);
        const request = https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                 https.get(response.headers.location, (res) => {
                     res.pipe(file);
                     file.on('finish', () => file.close(resolve));
                 }).on('error', reject);
                 return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error("Timeout"));
        });
    });
};

async function run() {
    try {
        await download("https://cdn.discordapp.com/attachments/1492459270564741273/1494195061628604558/sound_gashapon.mp3?ex=69e261d7&is=69e11057&hm=f3eea3775aa61af010ad684d3febe1f3f37712f83d33222465d22608977ec115&", "./public/audio/sound_gashapon.mp3");
        console.log("Finished 3");
        console.log("Downloads complete!");
    } catch (e) {
        console.error("Error downloading:", e);
    }
}

run();
