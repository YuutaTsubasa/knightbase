import { Pattern } from '../objects/Pattern';
import { CoinLinePattern } from './coinLine';
import { TrapComboPattern } from './trapCombo';
import { CoinArcPattern } from './coinArc';
import { EnemyCoinComboPattern } from './enemyCoinCombo';
import { GapPattern } from './gap';
import { GoalPattern } from './goal';

interface PatternConfig {
  type: string;
  params: Record<string, any>;
}

export class PatternFactory {
  static createPattern(config: PatternConfig): Pattern {
    switch (config.type) {
      case 'coinLine':
        return new CoinLinePattern(
          config.params.coinCount,
          config.params.spacing,
          config.params.height
        );
      
      case 'trapCombo':
        return new TrapComboPattern(
          config.params.trapCount,
          config.params.spacing
        );
      
      case 'coinArc':
        return new CoinArcPattern(
          config.params.coinCount,
          config.params.arcHeight,
          config.params.arcWidth,
          config.params.startY
        );
      
      case 'enemyCoinCombo':
        return new EnemyCoinComboPattern(
          config.params.enemyCount,
          config.params.coinCount,
          config.params.spacing
        );
      
      case 'gap':
        return new GapPattern(config.params.distance);
      
      case 'goal':
        return new GoalPattern();
      
      default:
        throw new Error(`Unknown pattern type: ${config.type}`);
    }
  }

  static createPatternsFromJson(patternData: any): Pattern[] {
    if (!patternData.patterns || !Array.isArray(patternData.patterns)) {
      throw new Error('Invalid pattern data: missing patterns array');
    }

    return patternData.patterns.map((config: PatternConfig) => 
      this.createPattern(config)
    );
  }
}