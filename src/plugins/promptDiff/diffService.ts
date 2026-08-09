import { DiffLine, WordToken } from './types';

// --- LCS (Longest Common Subsequence) Engine ---
function computeLCS<T>(arr1: T[], arr2: T[], equals: (a: T, b: T) => boolean): number[][] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (equals(arr1[i - 1], arr2[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

export function diffLines(oldLines: string[], newLines: string[]): DiffLine[] {
  const dp = computeLCS(oldLines, newLines, (a, b) => a === b);
  let i = oldLines.length;
  let j = newLines.length;
  const result: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: 'unchanged',
        oldLineNumber: i,
        newLineNumber: j,
        text: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        type: 'added',
        newLineNumber: j,
        text: newLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.push({
        type: 'removed',
        oldLineNumber: i,
        text: oldLines[i - 1],
      });
      i--;
    }
  }

  return result.reverse();
}

function tokenizeWords(text: string): string[] {
  return text.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]+|[a-zA-Z0-9_]+|[^\s\w]|[\s]+/g) || [text];
}

export function diffWords(oldText: string, newText: string): WordToken[] {
  const oldTokens = tokenizeWords(oldText);
  const newTokens = tokenizeWords(newText);
  const dp = computeLCS(oldTokens, newTokens, (a, b) => a === b);

  let i = oldTokens.length;
  let j = newTokens.length;
  const result: WordToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      result.push({ type: 'unchanged', text: oldTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'added', text: newTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.push({ type: 'removed', text: oldTokens[i - 1] });
      i--;
    }
  }

  return result.reverse();
}
