export function characterPortraitImageKey(characterId: string): string {
  return `${characterId}Portrait`;
}

export function characterRunImageKey(characterId: string): string {
  return `${characterId}Run`;
}

export function characterJumpImageKey(characterId: string): string {
  return `${characterId}Jump`;
}

export function characterAttackImageKey(characterId: string): string {
  return `${characterId}Attack`;
}

export function characterAttackEffectImageKey(characterId: string): string {
  return `${characterId}AttackEffect`;
}

export function characterWalkAudioKey(characterId: string): string {
  return `sfx_${characterId}Walk`;
}

export function characterAttackAudioKey(characterId: string): string {
  return `sfx_${characterId}Attack`;
}

export function characterBackgroundVideoKey(characterId: string): string {
  return `${characterId}Background`;
}

export function stageBackgroundImageKey(stageId: string): string {
  // Map stage1 -> stage01 for current assets  
  const assetStageId = stageId === "stage1" ? "stage01" : stageId;
  return `${assetStageId}background`;
}

export function stageBgmAudioKey(stageId: string): string {
  return `bgm_${stageId}`;
}