<script lang="ts">
  import PopupHost from '$lib/components/popup/PopupHost.svelte';
  import { FontAssets } from '$lib/assets/FontAssets';
  import { UniversalNavigationManager } from '$lib/systems/UniversalNavigationManager';
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { AudioManager } from '$lib/systems/AudioManager';
  import { LocalizationStore } from '$lib/systems/LocalizationStore';
  import { StaticDataStore } from '$lib/systems/StaticDataStore';
  let { children } = $props();

  let navigationManager: UniversalNavigationManager | null = null;

  // Initialize static data systems and navigation
  onMount(async () => {
    FontAssets.preload();
    AudioManager.initialize();
    LocalizationStore.initialize();
    StaticDataStore.initialize();
    navigationManager = UniversalNavigationManager.getInstance();
  });

  onDestroy(() => {
    if (navigationManager) {
      navigationManager.destroy();
    }
  });

  // Function to update body class
  function updateBodyClass(pathname: string) {
    if (typeof document !== 'undefined') {
      // Remove all existing route classes
      const classesToRemove = Array.from(document.body.classList).filter(className => 
        className.startsWith('route-')
      );
      classesToRemove.forEach(className => {
        document.body.classList.remove(className);
      });

      // Add current route class
      const routeClass = `route-${pathname.replace(/\//g, '') || 'root'}`;
      document.body.classList.add(routeClass);
    }
  }

  // Function to handle navigation based on page
  function updateNavigationMode(pathname: string) {
    if (navigationManager) {
      const isGameplayPage = pathname === '/gameplay';
      navigationManager.setGameplayMode(isGameplayPage);
      
      // Refresh focusable elements when page changes (after a short delay for DOM updates)
      setTimeout(() => {
        navigationManager?.refreshFocusableElements();
      }, 100);
    }
  }

  // Use $effect to watch for page changes in Svelte 5
  $effect(() => {
    updateBodyClass(page.url.pathname);
    updateNavigationMode(page.url.pathname);
  });
</script>

<PopupHost />
{@render children()}

<link rel="stylesheet" href="/styles/adjustment.css" />
<link rel="stylesheet" href="/styles/animations.css" />