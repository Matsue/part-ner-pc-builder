import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Project-specific design checks; contrast and reflow still need browser checks.
export function lintClassNames(value: string): string[] {
  const issues: string[] = [];
  for (const match of value.matchAll(/text-\[([\d.]+)(px|rem)\]/g)) {
    const pixels = Number(match[1]) * (match[2] === 'rem' ? 16 : 1);
    if (pixels < 12) issues.push(`Use a typography token of at least 12px, not ${match[0]}`);
  }
  if (/text-zinc-[5-9]00\b/.test(value)) {
    issues.push('Use text-muted-foreground for secondary text on the dark surface');
  }
  if (/\btruncate\b|\bline-clamp-\d+\b/.test(value)) {
    issues.push('Keep product names and decision-making text fully readable');
  }
  return issues;
}

function lintSource(path: string): string[] {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      for (const issue of lintClassNames(node.text)) {
        issues.push(`${path}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${issue}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = readdirSync('app', { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.tsx'))
    .flatMap((path) => lintSource(`app/${path}`));
  const css = readFileSync('app/globals.css', 'utf8');
  for (const match of css.matchAll(/font-size:\s*([\d.]+)(px|rem)/g)) {
    if (Number(match[1]) * (match[2] === 'rem' ? 16 : 1) < 12) issues.push(`app/globals.css: Small font: ${match[0]}`);
  }
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Accessibility design lint passed.');
  }
}
