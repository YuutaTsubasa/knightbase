<script lang="ts">
  import PopupHost from '$lib/components/popup/PopupHost.svelte';
  import { FontAssets } from '$lib/assets/FontAssets';
  import { LocalizationAssets } from '$lib/assets/LocalizationAssets';
  import { StaticDataStore } from '$lib/systems/StaticDataStore';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  FontAssets.preload();
  
  // Initialize static data systems
  onMount(() => {
    LocalizationAssets.initialize();
    StaticDataStore.initialize();
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

  // Use $effect to watch for page changes in Svelte 5
  $effect(() => {
    updateBodyClass(page.url.pathname);
  });
</script>

<PopupHost />
<slot />

<link rel="stylesheet" href="/styles/adjustment.css" />
<link rel="stylesheet" href="/styles/animations.css" />