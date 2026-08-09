import React, { useMemo, useState } from 'react';
import { PluginComponentProps } from '../../core/types/plugin';
import { FileDropZone } from '../../core/components/FileDropZone';
import { ExportButtons } from '../../core/components/ExportButtons';
import { LoadedFile } from '../../core/types/file';
import { analyzeDocuments } from './analyzerService';
import { SAMPLE_FILES } from './sampleData';
import { AnalysisResult } from './types';
export const DocumentConsistencyCheckerComponent: React.FC<PluginComponentProps> = () => {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'term' | 'task' | 'section' | 'todo'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // サンプルデータ一括読み込み
  const handleLoadSample = () => {
    setFiles(SAMPLE_FILES);
  };

  // ドキュメント解析処理
  const analysis: AnalysisResult = useMemo(() => {
    if (files.length === 0) {
      return {
        score: 100,
        totalFiles: 0,
        issues: [],
        taskMatrix: [],
        termVariants: [],
        stats: {
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          termCount: 0,
          taskMismatchCount: 0,
          missingSectionCount: 0,
          todoCount: 0,
        },
      };
    }
    return analyzeDocuments(files);
  }, [files]);

  // フィルタリング後の問題リスト
  const filteredIssues = useMemo(() => {
    return analysis.issues.filter((issue) => {
      // タブフィルター
      if (activeTab === 'term' && issue.type !== 'term_inconsistency') return false;
      if (activeTab === 'task' && issue.type !== 'task_status_mismatch') return false;
      if (activeTab === 'section' && issue.type !== 'missing_section') return false;
      if (activeTab === 'todo' && issue.type !== 'unfinished_todo') return false;

      // 深刻度フィルター
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;

      // 検索クエリ
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(query);
        const matchDesc = issue.description.toLowerCase().includes(query);
        const matchFile = issue.targetFiles.some((f) => f.toLowerCase().includes(query));
        return matchTitle || matchDesc || matchFile;
      }

      return true;
    });
  }, [analysis.issues, activeTab, severityFilter, searchQuery]);

  // レポートMarkdownコンテンツ生成
  const reportMarkdown = useMemo(() => {
    if (files.length === 0) return '# ドキュメント整合性解析レポート\n\nファイルが読み込まれていません。';

    return `# 📄 ドキュメント整合性解析レポート (DocumentConsistencyChecker)

## 📊 解析サマリー
- **解析対象ファイル数**: ${analysis.totalFiles} 個
- **整合性スコア**: ${analysis.score} / 100 点
- **検出された課題総数**: ${analysis.issues.length} 件 (High: ${analysis.stats.highCount}, Medium: ${analysis.stats.mediumCount}, Low: ${analysis.stats.lowCount})
- **実行日時**: ${new Date().toLocaleString()}

### 内訳
- 🔴 タスクステータス矛盾: ${analysis.stats.taskMismatchCount} 件
- 🟡 表記ゆれ検出: ${analysis.stats.termCount} 件
- 🟡 欠落セクション: ${analysis.stats.missingSectionCount} 件
- 🔵 未完了TODO / タスク: ${analysis.stats.todoCount} 件

---

## 🎯 タスクステータス照合マトリックス
| タスクID | 整合性 | 各ファイルでのステータス |
| :--- | :---: | :--- |
${analysis.taskMatrix
  .map(
    (item) =>
      `| **${item.taskId}** | ${item.isConsistent ? '✅ 整合' : '❌ 矛盾'} | ${Object.entries(item.statuses)
        .map(([f, s]) => `${f}: ${s}`)
        .join(', ')} |`
  )
  .join('\n')}

---

## ⚠️ 検出された問題・改善アドバイス

${analysis.issues
  .map(
    (issue, i) => `### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}
- **対象ファイル**: ${issue.targetFiles.join(', ')}
- **詳細**: ${issue.description}
${issue.suggestion ? `- **推奨アクション**: ${issue.suggestion}` : ''}
`
  )
  .join('\n')}
`;
  }, [files, analysis]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ツールヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📄 Document Consistency Checker
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            複数プロジェクトドキュメント間での用語の表記ゆれ、タスクステータスの矛盾、セクション欠落、TODO残数を一括自動検出。
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-muted"
            onClick={handleLoadSample}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
          >
            🧪 デモ用サンプルファイル読込
          </button>
          {files.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={() => setFiles([])}
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* File Drop Zone */}
      <FileDropZone
        files={files}
        options={{
          accept: ['.md', '.txt', '.json', '.rst'],
        }}
        onFilesLoaded={setFiles}
        title="プロジェクトドキュメントの一括ドロップ"
        description="README.md / SCHEDULE.md / RECORD.md 等のファイルを複数ドラッグ＆ドロップ（またはクリックして選択）"
      />

      {/* 解析結果ビュー（ファイル読み込み時） */}
      {files.length > 0 && (
        <>
          {/* ダッシュボードカード */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* スコアカード */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>整合性スコア</span>
                <div
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: analysis.score >= 80 ? '#10b981' : analysis.score >= 50 ? '#f59e0b' : '#ef4444',
                    lineHeight: 1.2,
                  }}
                >
                  {analysis.score}
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}> / 100</span>
                </div>
              </div>
              <div style={{ fontSize: '2.5rem' }}>
                {analysis.score >= 80 ? '🛡️' : analysis.score >= 50 ? '⚠️' : '🚨'}
              </div>
            </div>

            {/* ドキュメント数 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>読み込みファイル数</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>
                {analysis.totalFiles} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>files</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {files.map((f) => f.name).join(', ')}
              </div>
            </div>

            {/* 問題数サマリー */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>検出された問題</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>
                {analysis.issues.length} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>件</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span className="badge badge-danger">High: {analysis.stats.highCount}</span>
                <span className="badge badge-warning">Med: {analysis.stats.mediumCount}</span>
                <span className="badge badge-info">Low: {analysis.stats.lowCount}</span>
              </div>
            </div>

            {/* 項目別集計 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>カテゴリ別ブレークダウン</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '0.8125rem' }}>
                <div>🔴 ステータス矛盾: <strong>{analysis.stats.taskMismatchCount}</strong></div>
                <div>🟡 表記ゆれ: <strong>{analysis.stats.termCount}</strong></div>
                <div>🔵 未完了TODO: <strong>{analysis.stats.todoCount}</strong></div>
              </div>
            </div>
          </div>

          {/* タスク照合マトリックスセクション */}
          {analysis.taskMatrix.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎯 タスクステータス比較マトリックス
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>タスク ID</th>
                      <th style={{ padding: '8px 12px' }}>整合性</th>
                      {files.map((f) => (
                        <th key={f.name} style={{ padding: '8px 12px' }}>{f.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.taskMatrix.map((item) => (
                      <tr key={item.taskId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.taskId}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {item.isConsistent ? (
                            <span className="badge badge-success">✅ 一致</span>
                          ) : (
                            <span className="badge badge-danger">❌ 矛盾あり</span>
                          )}
                        </td>
                        {files.map((f) => {
                          const st = item.statuses[f.name];
                          return (
                            <td key={f.name} style={{ padding: '8px 12px', color: st ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {st ? (
                                <span
                                  style={{
                                    fontWeight: st === '完了' ? 600 : 400,
                                    color: st === '完了' ? '#10b981' : st === '進行中' ? '#3b82f6' : 'var(--text-secondary)',
                                  }}
                                >
                                  {st}
                                </span>
                              ) : (
                                '―'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 表記ゆれ一覧パネル */}
          {analysis.termVariants.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔤 検出された用語表記ゆれグループ
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {analysis.termVariants.map((tv, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      標準提案: <span style={{ color: '#10b981', textDecoration: 'underline' }}>{tv.baseTerm}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {tv.variants.map((v, vidx) => (
                        <div key={vidx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>• "{v.text}"</span>
                          <span style={{ fontSize: '0.75rem' }}>
                            {v.count}回 ({v.files.join(', ')})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* フィルター＆検索・詳細問題リスト */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                📋 整合性エラー・改善リスト ({filteredIssues.length} / {analysis.issues.length})
              </h3>

              {/* 検索・フィルター */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="問題・ファイルを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-muted)',
                    color: 'var(--text-primary)',
                    minWidth: '180px',
                  }}
                />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-muted)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="all">全深刻度</option>
                  <option value="high">High (高)</option>
                  <option value="medium">Medium (中)</option>
                  <option value="low">Low (低)</option>
                </select>
              </div>
            </div>

            {/* カテゴリタブ */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <button
                className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('all')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                すべて ({analysis.issues.length})
              </button>
              <button
                className={`btn ${activeTab === 'task' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('task')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                タスク矛盾 ({analysis.stats.taskMismatchCount})
              </button>
              <button
                className={`btn ${activeTab === 'term' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('term')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                表記ゆれ ({analysis.stats.termCount})
              </button>
              <button
                className={`btn ${activeTab === 'section' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('section')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                欠落セクション ({analysis.stats.missingSectionCount})
              </button>
              <button
                className={`btn ${activeTab === 'todo' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('todo')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                未完了TODO ({analysis.stats.todoCount})
              </button>
            </div>

            {/* 問題カードリスト */}
            {filteredIssues.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                条件に該当する整合性問題は見つかりませんでした。🎉
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-muted)',
                      borderLeft: `4px solid ${
                        issue.severity === 'high' ? '#ef4444' : issue.severity === 'medium' ? '#f59e0b' : '#3b82f6'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{issue.title}</span>
                      <span
                        className={`badge ${
                          issue.severity === 'high'
                            ? 'badge-danger'
                            : issue.severity === 'medium'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {issue.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>対象: <strong>{issue.targetFiles.join(', ')}</strong></div>
                      {issue.suggestion && (
                        <div style={{ color: '#10b981', fontWeight: 500 }}>💡 提言: {issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Export Integration */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              📤 解析レポートのエクスポート
            </h3>
            <ExportButtons
              content={reportMarkdown}
              filename="document_consistency_report"
              addTimestamp={true}
            />
          </div>
        </>
      )}
    </div>
  );
};
