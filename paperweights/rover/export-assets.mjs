// Export the frozen game's exact SVG strings; never edit the source game.
import { SYMBOLS } from '../../space/rover-run/src/web/symbols.js';
import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./symbols.json', import.meta.url), JSON.stringify(SYMBOLS, null, 2) + '\n');
