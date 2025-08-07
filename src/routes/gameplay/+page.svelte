<script lang="ts">
  import { page } from '$app/stores';
  import Page from "$lib/components/Page.svelte";
  import { wait, waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { onDestroy } from "svelte";
  import { playerStore } from "$lib/systems/PlayerStore";
  import { AudioManager } from "$lib/systems/AudioManager";
  
  // Import the new modular runner game
  import RunnerMainGame from "$lib/components/gameplay/runner/RunnerMainGame.svelte";

  let goToNextScene: Writable<string | null>;
  let runnerGame: RunnerMainGame;

  // Parse URL parameters for game mode
  $: gameMode = ($page.url.searchParams.get('mode') || 'endless') as 'endless' | 'level';
  $: levelId = $page.url.searchParams.get('levelId') || '';
  
  $: selectedCharacter = $playerStore.selectedCharacter;
  $: selectedStage = $playerStore.selectedStage;

  function handleExit() {
    // If we came from a level, go back to the stage detail page
    if (gameMode === 'level' && selectedStage) {
      goToNextScene.set(`/stage/${selectedStage}`);
    } else {
      goToNextScene.set(`/stage/${selectedStage}`);
    }
  }
  
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/stage";
  }

  onDestroy(() => {
    // Stop BGM when leaving the gameplay page
    AudioManager.stopBGM();
  });
</script>

<Page mainProgress={main} 
  contentStyle="box-sizing: border-box; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
  
  <!-- Game Canvas using new modular component -->
  <RunnerMainGame 
    bind:this={runnerGame}
    {selectedCharacter}
    {selectedStage}
    onExit={handleExit}
    gameMode={gameMode}
    {levelId}
  />
</Page>

