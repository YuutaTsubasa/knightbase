<script>
  import PopupHost from '$lib/components/popup/PopupHost.svelte';
  import { FontAssets } from '$lib/assets/FontAssets';

  FontAssets.preload();
</script>

<PopupHost />
<slot />

<link rel="stylesheet" href="/styles/animations.css" />