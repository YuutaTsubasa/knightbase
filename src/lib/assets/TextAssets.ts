// Text assets registry for JSON pattern files and other text-based assets
export interface PatternData {
  id: string;
  name: string;
  patterns: string[]; // Array of pattern IDs that make up this stage
}

export interface TextAsset {
  id: string;
  path: string;
  type: 'pattern' | 'config' | 'data';
}

export const textAssets: Record<string, TextAsset> = {
  // Stage pattern definitions
  'stage1_1': {
    id: 'stage1_1',
    path: '/assets/gameplay/runner/stage1_1.json',
    type: 'pattern'
  },
  'stage1_2': {
    id: 'stage1_2', 
    path: '/assets/gameplay/runner/stage1_2.json',
    type: 'pattern'
  },
  'stage1_3': {
    id: 'stage1_3',
    path: '/assets/gameplay/runner/stage1_3.json', 
    type: 'pattern'
  },
  'stage1_4': {
    id: 'stage1_4',
    path: '/assets/gameplay/runner/stage1_4.json',
    type: 'pattern'
  },
  'stage1_5': {
    id: 'stage1_5',
    path: '/assets/gameplay/runner/stage1_5.json',
    type: 'pattern'
  },
  // Add more stages as needed
};

export class TextAssetManager {
  private static cache: Map<string, any> = new Map();

  static async load(assetId: string): Promise<any> {
    if (this.cache.has(assetId)) {
      return this.cache.get(assetId);
    }

    const asset = textAssets[assetId];
    if (!asset) {
      throw new Error(`Text asset not found: ${assetId}`);
    }

    try {
      const response = await fetch(asset.path);
      if (!response.ok) {
        throw new Error(`Failed to load ${asset.path}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.cache.set(assetId, data);
      return data;
    } catch (error) {
      console.error(`Error loading text asset ${assetId}:`, error);
      throw error;
    }
  }

  static async loadPatternData(stageId: string): Promise<PatternData> {
    return await this.load(stageId);
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static preloadAssets(assetIds: string[]): Promise<any[]> {
    return Promise.all(assetIds.map(id => this.load(id)));
  }
}