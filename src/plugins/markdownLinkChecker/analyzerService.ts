import { LoadedFile } from '../../core/types/file';
import { ExtractedLink } from './types';

/**
 * Normalizes relative paths for file matching
 */
function normalizePath(basePath: string, relativePath: string): string {
  const cleanRelative = relativePath.split('#')[0].split('?')[0];
  if (!basePath.includes('/') && !basePath.includes('\\')) {
    // Top-level file
    return cleanRelative.replace(/^(\.\/|\/)/, '');
  }
  const parts = basePath.replace(/\\/g, '/').split('/');
  parts.pop(); // Remove filename
  const relParts = cleanRelative.split('/');

  for (const part of relParts) {
    if (part === '.') continue;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

/**
 * Parser for extracting and validating links in Markdown documents
 */
export function parseAndValidateLinks(files: LoadedFile[]): {
  links: ExtractedLink[];
  fileMap: Set<string>;
} {
  const links: ExtractedLink[] = [];
  const fileSet = new Set<string>();

  // Register all loaded file paths (normalized)
  files.forEach((f) => {
    fileSet.add(f.name.toLowerCase().replace(/\\/g, '/'));
    if (f.relativePath) {
      fileSet.add(f.relativePath.toLowerCase().replace(/\\/g, '/'));
    }
  });

  // Extract headings per file for anchor validation
  const headingsPerFile = new Map<string, Set<string>>();
  files.forEach((f) => {
    const headings = new Set<string>();
    const lines = f.content.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^#{1,6}\s+(.+)$/);
      if (match) {
        const title = match[1].trim();
        const slug = title
          .toLowerCase()
          .replace(/[^\w\u3000-\u30fe\u4e00-\u9fa5\s-]/g, '')
          .replace(/\s+/g, '-');
        headings.add(slug);
        headings.add(title.toLowerCase());
      }
    });
    headingsPerFile.set(f.name.toLowerCase(), headings);
  });

  let linkIdCounter = 1;

  files.forEach((f) => {
    // Only parse markdown/text files
    if (f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.svg') || f.name.endsWith('.gif')) {
      return;
    }

    const lines = f.content.split('\n');
    let isInsideFencedCodeBlock = false;
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;

      // コード例内のリンク記法は検査対象外にする
      if (/^\s*(`{3,}|~{3,})/.test(lineText)) {
        isInsideFencedCodeBlock = !isInsideFencedCodeBlock;
        return;
      }
      if (isInsideFencedCodeBlock) return;

      // 1. Markdown Images ![alt](url)
      const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let match: RegExpExecArray | null;
      while ((match = mdImageRegex.exec(lineText)) !== null) {
        const alt = match[1] || '[Image]';
        const target = match[2].trim();
        const isExternal = /^https?:\/\//i.test(target) || /^data:/i.test(target);

        let status: ExtractedLink['status'] = 'valid';
        let reason = '';

        if (isExternal) {
          status = 'external';
          reason = '外部画像URL (オフライン環境のため実在未検証)';
        } else {
          const normTarget = normalizePath(f.name, target).toLowerCase();
          const exists = Array.from(fileSet).some(
            (fp) => fp === normTarget || fp.endsWith('/' + normTarget) || normTarget.endsWith(fp)
          );

          if (files.length === 1 && !exists) {
            status = 'broken';
            reason = `単一ファイル検証: 参照画像 "${target}" がロード一覧に含まれていません`;
          } else if (!exists) {
            status = 'broken';
            reason = `画像参照エラー: ファイル "${target}" が見つかりません`;
          } else {
            status = 'valid';
            reason = '画像ファイルが読み込み済みリストに存在します';
          }
        }

        links.push({
          id: `link-${linkIdCounter++}`,
          sourceFile: f.name,
          line: lineNum,
          text: `![${alt}]`,
          target,
          type: 'relative_image',
          status,
          reason,
        });
      }

      // 2. Markdown Links [text](url) (Exclude image prefix !)
      const mdLinkRegex = /(?:^|[^!])\[([^\]]+)\]\(([^)]+)\)/g;
      while ((match = mdLinkRegex.exec(lineText)) !== null) {
        const text = match[1];
        const target = match[2].trim();

        if (target.startsWith('#')) {
          // Anchor link
          const anchorName = target.slice(1).toLowerCase();
          const headings = headingsPerFile.get(f.name.toLowerCase());
          const isValidAnchor = headings ? headings.has(anchorName) : false;

          links.push({
            id: `link-${linkIdCounter++}`,
            sourceFile: f.name,
            line: lineNum,
            text,
            target,
            type: 'anchor',
            status: isValidAnchor ? 'anchor_valid' : 'anchor_broken',
            reason: isValidAnchor
              ? '同一ドキュメント内に一致する見出しが存在します'
              : `アンカーエラー: 見出し "${target}" が見つかりません`,
          });
          continue;
        }

        const isExternal = /^https?:\/\//i.test(target) || /^mailto:/i.test(target);
        if (isExternal) {
          links.push({
            id: `link-${linkIdCounter++}`,
            sourceFile: f.name,
            line: lineNum,
            text,
            target,
            type: 'external_url',
            status: 'external',
            reason: '外部Webサイトへのリンク (接続確認スキップ)',
          });
          continue;
        }

        // Relative file link
        const normTarget = normalizePath(f.name, target).toLowerCase();
        const exists = Array.from(fileSet).some(
          (fp) => fp === normTarget || fp.endsWith('/' + normTarget) || normTarget.endsWith(fp)
        );

        let status: ExtractedLink['status'] = 'valid';
        let reason = '参照ファイルが存在します';

        if (!exists) {
          status = 'broken';
          reason = files.length === 1
            ? `単一ドキュメント解析: リンク先 "${target}" は別ファイル参照です`
            : `リンク切れ: 相対ファイル "${target}" がロード済みフォルダに存在しません`;
        }

        links.push({
          id: `link-${linkIdCounter++}`,
          sourceFile: f.name,
          line: lineNum,
          text,
          target,
          type: 'relative_file',
          status,
          reason,
        });
      }
    });
  });

  return { links, fileMap: fileSet };
}
