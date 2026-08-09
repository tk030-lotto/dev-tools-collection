/**
 * Extracted Link Information Interface
 */
export interface ExtractedLink {
  id: string;
  sourceFile: string;
  line: number;
  text: string;
  target: string;
  type: 'relative_file' | 'relative_image' | 'anchor' | 'external_url';
  status: 'valid' | 'broken' | 'external' | 'anchor_valid' | 'anchor_broken';
  reason?: string;
}
