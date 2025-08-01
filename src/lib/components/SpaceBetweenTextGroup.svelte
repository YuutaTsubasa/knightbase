<script lang="ts">
  export let content: string;
  export let spacing: string = "0.5em";
</script>

<div>
  {#each Array.from(content) as char, i}
    <span class="char" style="margin-right: {i < content.length - 1 ? spacing : '0'}">{char}</span>
  {/each}
</div>