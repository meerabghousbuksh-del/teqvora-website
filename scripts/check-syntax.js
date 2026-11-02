// Runs `node --check` on every JavaScript file in the project (excluding node_modules).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git']);

function collectJavaScriptFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return SKIPPED_DIRECTORIES.has(entry.name) ? [] : collectJavaScriptFiles(fullPath);
        }
        return entry.name.endsWith('.js') ? [fullPath] : [];
    });
}

const files = collectJavaScriptFiles(ROOT);
let failures = 0;

files.forEach((file) => {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
        failures += 1;
        console.error(`FAIL ${path.relative(ROOT, file)}\n${result.stderr}`);
    }
});

console.log(`${files.length - failures}/${files.length} files passed the syntax check.`);
process.exit(failures === 0 ? 0 : 1);
