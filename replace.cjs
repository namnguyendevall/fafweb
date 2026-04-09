const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFiles() {
    let replacedCount = 0;
    walkDir(path.join(__dirname, 'src'), function(filePath) {
        if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.ts')) {
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let initialContent = content;

        // Pattern 1: template strings like `$${...}` -> `${...} CRED`
        // We look for `$${` replaced with `${` and if the template string ends there, append ` CRED`
        // We will just do a simpler search: `$${` -> `${` and we manually append ` CRED` using regex.
        // E.g., `$${Number(job.budget)}` -> `${Number(job.budget)} CRED`
        content = content.replace(/\$\$\{([^}]+)\}/g, (match, expr) => {
            return `\${${expr}} CRED`;
        });

        // Pattern 2: JSX text like `>${...}<` -> `>{...} CRED<`
        content = content.replace(/>\$\{([^}]+)\}</g, (match, expr) => {
            return `>{${expr}} CRED<`;
        });
        
        // Pattern 3: `>${...}` followed by whitespace -> `>{...} CRED` (e.g. `>\$${...}  `)
        content = content.replace(/>\$\{([^}]+)\}(\s+)/g, (match, expr, space) => {
            return `>{${expr}} CRED${space}`;
        });

        // Pattern 4: Literal strings like `$520` -> `520 CRED`
        // Mostly in i18n.js or simple places.
        content = content.replace(/\$(\d+[\d,.]*)/g, (match, number) => {
            return `${number} CRED`;
        });

        // Pattern 5: Any remaining JSX `$ {` combinations like `<span ...>$</span>`
        // Some places use explicitly `<span>$</span>`.
        content = content.replace(/>\$</g, '>CRED<');

        // Pattern 6: Cleanup cases where we get `CRED CRED` due to previous patterns.
        content = content.replace(/CRED(\s*)CRED/g, 'CRED');

        if (content !== initialContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            replacedCount++;
            console.log('Updated:', filePath);
        }
    });

    console.log(`Replaced in ${replacedCount} files.`);
}

processFiles();
