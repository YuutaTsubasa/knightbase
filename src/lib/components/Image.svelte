<script lang="ts">
  import { imageAssets } from "$lib/assets/ImageAssets";

  export let key: keyof typeof imageAssets;
  export let alt = '';
  export let className = '';  
  export let style = '';
</script>

<img src={imageAssets[key]} alt={alt} class={className} style={style} />