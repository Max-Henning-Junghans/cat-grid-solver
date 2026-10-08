import test from 'node:test';
import assert from 'node:assert/strict';
import {copy,explain,translate} from '../dist/i18n.js';
import {example} from '../dist/example.js';
import {resolveUntilStuck,resolveCurrent,techniques} from '../dist/solver.js';

test('English and German cover the same interface, errors, and instructions',()=>{
  assert.deepEqual(Object.keys(copy.de).sort(),Object.keys(copy.en).sort());
  for(const language of ['en','de'])for(const value of Object.values(copy[language]))assert.ok(typeof value==='string'&&value.length);
  for(const technique of techniques)assert.ok(technique.name.every(Boolean)&&technique.description.every(Boolean));
  assert.notEqual(translate('en','applyAll'),translate('en','run'));
  assert.notEqual(translate('de','applyAll'),translate('de','run'));
});

test('real deductions have fully interpolated explanations in both languages',()=>{
  const steps=[...resolveUntilStuck(example).steps,...resolveCurrent(example).steps];
  for(const language of ['en','de'])for(const step of steps) {
    const text=explain(language,example,step);
    assert.ok(text.length>30);assert.ok(!/\{\w+\}/.test(text));
  }
});
