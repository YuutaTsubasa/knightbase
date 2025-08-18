<script lang="ts">
  import { Coins, Star, Diamond, Gem, Gift } from 'lucide-svelte';

  export let rewardType: string;
  export let size: number = 24;
  export let color: string = '#374151';

  function getIconComponent(type: string) {
    switch (type) {
      case 'gold':
        return Coins;
      case 'exp':
        return Star;
      case 'diamond':
        return Diamond;
      case 'ruby':
        return Gem;
      default:
        return Gift;
    }
  }

  $: IconComponent = getIconComponent(rewardType);
</script>

<svelte:component this={IconComponent} {size} {color} />