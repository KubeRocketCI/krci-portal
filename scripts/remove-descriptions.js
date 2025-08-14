const fs = require('fs');
const path = require('path');

function getIndentLen(line) {
	let i = 0;
	while (i < line.length && line[i] === ' ') i += 1;
	return i;
}

function removeDescriptionsFromText(text) {
	const lines = text.split(/\r?\n/);
	const out = [];
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const m = line.match(/^(\s*)description\s*:(.*)$/);
		if (!m) {
			out.push(line);
			continue;
		}

		const baseIndent = m[1].length;
		const value = m[2].trim();

		// Skip the current description line
		// If it's a block scalar (|, |-, >, >-) then also skip following indented lines
		if (value.startsWith('|') || value.startsWith('>')) {
			// Skip subsequent lines that belong to this block scalar
			while (i + 1 < lines.length) {
				const next = lines[i + 1];
				if (next.trim() === '') {
					i += 1; // skip blank lines inside the block
					continue;
				}
				const nextIndent = getIndentLen(next);
				if (nextIndent > baseIndent) {
					i += 1; // still part of the block, skip
					continue;
				}
				break; // block ends
			}
			continue; // done skipping this description
		}

		// Inline scalar (same line). Already skipped by not pushing it
		continue;
	}
	return out.join('\n');
}

function main() {
	const fileArg = process.argv[2];
	if (!fileArg) {
		console.error('Usage: node scripts/remove-descriptions.js <path-to-yaml>');
		process.exit(1);
	}
	const abs = path.resolve(process.cwd(), fileArg);
	const input = fs.readFileSync(abs, 'utf8');
	const output = removeDescriptionsFromText(input);
	fs.writeFileSync(abs, output, 'utf8');
	console.log(`Descriptions removed from: ${fileArg}`);
}

if (require.main === module) {
	main();
} 