<script>
  import PopupHost from '$lib/components/popup/PopupHost.svelte';
  import { FontAssets } from '$lib/assets/FontAssets';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  FontAssets.preload();

  // Reactive statement to update body class when route changes
  $: {
    if (typeof document !== 'undefined') {
      // Remove all existing route classes
      const classesToRemove = Array.from(document.body.classList).filter(className => 
        className.startsWith('route-')
      );
      classesToRemove.forEach(className => {
        document.body.classList.remove(className);
      });

      // Add current route class
      const currentPath = page.url.pathname;
      const routeClass = `route-${currentPath.replace(/\//g, '') || 'root'}`;
      document.body.classList.add(routeClass);
    }
  }
</script>

<PopupHost />
<slot />

<link rel="stylesheet" href="/styles/adjustment.css" />
<link rel="stylesheet" href="/styles/animations.css" />