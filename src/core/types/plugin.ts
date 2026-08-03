import React from 'react';

/**
 * Categories for DevTools Plugins
 */
export type PluginCategory =
  | 'developer'
  | 'converter'
  | 'analyzer'
  | 'generator'
  | 'utility';

/**
 * Metadata defining a DevTool Plugin
 */
export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: PluginCategory;
  icon?: string; // Lucide icon name or emoji fallback
  author?: string;
  keywords?: string[];
}

/**
 * Props passed automatically to all ToolPlugin components
 */
export interface PluginComponentProps {
  metadata: PluginMetadata;
  [key: string]: unknown;
}

/**
 * Full Plugin definition interface
 */
export interface ToolPlugin {
  metadata: PluginMetadata;
  component: React.ComponentType<PluginComponentProps>;
  onInit?: () => void | Promise<void>;
  onDestroy?: () => void;
}

/**
 * Listener function for registry change notifications
 */
export type PluginRegistryListener = () => void;
