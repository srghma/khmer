import fs from 'fs';
import path from 'path';

const locales = ['en', 'ru', 'uk', 'km'];
const baseDir = './src/i18n';
const outDir = './messages';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function flatten(obj, prefix = '') {
    let result = {};
    for (const key in obj) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flatten(obj[key], newKey));
        } else {
            result[newKey] = String(obj[key]);
        }
    }
    return result;
}

async function convert() {
    for (const locale of locales) {
        const filePath = path.join(baseDir, locale, 'index.ts');
        if (!fs.existsSync(filePath)) continue;
        let content = fs.readFileSync(filePath, 'utf-8');
        content = content.replace(/^import.*$/m, '');
        content = content.replace(/satisfies Translation/g, '');
        const tempFile = `./temp-${locale}.js`;
        fs.writeFileSync(path.join(baseDir, tempFile), content);
        try {
            const module = await import(`./src/i18n/temp-${locale}.js`);
            const flattened = flatten(module.default);
            fs.writeFileSync(path.join(outDir, `${locale}.json`), JSON.stringify(flattened, null, 2));
            console.log(`Converted ${locale}`);
        } catch (e) {
            console.error(`Failed to convert ${locale}`, e);
        } finally {
            if (fs.existsSync(path.join(baseDir, tempFile))) fs.unlinkSync(path.join(baseDir, tempFile));
        }
    }
}
convert();
