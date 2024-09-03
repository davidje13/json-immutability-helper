import defaultExport, {
  UNSET_TOKEN,
  combine,
  context,
  invariant,
  update,
} from 'json-immutability-helper';
import stringCommands from 'json-immutability-helper/commands/string';

function fail() {
  throw new Error('ESM test failed');
}

function checkSame(a, name) {
  const b = context[name];
  const nameB = `context.${name}`;
  if (a !== b) {
    console.error(`expected ${name} to be ${nameB}, but`, a, '!=', b);
    fail();
  }
  if (!a) {
    console.error(`expected ${name} to be ${nameB}, but neither is set`);
    fail();
  }
}

if (!defaultExport) {
  console.error('missing default export', defaultExport);
  fail();
}

if (defaultExport !== context) {
  console.error('expected default export to be context, but', defaultExport, '!=', context);
  fail();
}
checkSame(update, 'update');
checkSame(combine, 'combine');
checkSame(invariant, 'invariant');
checkSame(UNSET_TOKEN, 'UNSET_TOKEN');

const result1 = update(0, ['=', 1]);
if (result1 !== 1) {
  console.error('Invoking update() failed');
  fail();
}

const result2 = update.with(stringCommands)('a', ['replaceAll', 'a', 'b']);
if (result2 !== 'b') {
  console.error('Invoking update.with(stringCommands) failed');
  fail();
}

process.stderr.write('ES6 import test succeeded\n');
