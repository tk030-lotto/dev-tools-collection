import { ToolPlugin, PluginCategory, PluginRegistryListener } from '../types/plugin';

/**
 * Central registry for managing Tool Plugins in DevTools Suite.
 * Implements Singleton pattern with change event subscription.
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, ToolPlugin> = new Map();
  private listeners: Set<PluginRegistryListener> = new Set();

  private constructor() {}

  /**
   * Get the singleton instance of PluginRegistry
   */
  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Register a new plugin
   */
  public register(plugin: ToolPlugin): boolean {
    if (!plugin?.metadata?.id) {
      console.error('[PluginRegistry] Cannot register plugin without valid id', plugin);
      return false;
    }

    if (this.plugins.has(plugin.metadata.id)) {
      console.warn(`[PluginRegistry] Plugin with id "${plugin.metadata.id}" is already registered. Overwriting.`);
    }

    this.plugins.set(plugin.metadata.id, plugin);

    try {
      plugin.onInit?.();
    } catch (err) {
      console.error(`[PluginRegistry] Error executing onInit for plugin "${plugin.metadata.id}":`, err);
    }

    this.notifyListeners();
    return true;
  }

  /**
   * Unregister a plugin by ID
   */
  public unregister(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    try {
      plugin.onDestroy?.();
    } catch (err) {
      console.error(`[PluginRegistry] Error executing onDestroy for plugin "${pluginId}":`, err);
    }

    const deleted = this.plugins.delete(pluginId);
    if (deleted) {
      this.notifyListeners();
    }
    return deleted;
  }

  /**
   * Get a registered plugin by ID
   */
  public get(pluginId: string): ToolPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all registered plugins
   */
  public getAll(): ToolPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins filtered by category
   */
  public getByCategory(category: PluginCategory): ToolPlugin[] {
    return this.getAll().filter((p) => p.metadata.category === category);
  }

  /**
   * Clear all registered plugins
   */
  public clear(): void {
    this.plugins.forEach((plugin) => {
      try {
        plugin.onDestroy?.();
      } catch (err) {
        console.error(`[PluginRegistry] Error in onDestroy during clear:`, err);
      }
    });
    this.plugins.clear();
    this.notifyListeners();
  }

  /**
   * Subscribe to registry changes (returns unsubscribe function)
   */
  public subscribe(listener: PluginRegistryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers when registry changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[PluginRegistry] Error in registry listener:', err);
      }
    });
  }
}

/**
 * Convenient singleton instance export
 */
export const pluginRegistry = PluginRegistry.getInstance();
