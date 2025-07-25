<script lang="ts">
  import { wait } from '$lib/utils/Wait';
  import Page from '$lib/components/Page.svelte';
  import type { ITransitionComponent } from '$lib/animations/transitions/ITransitionComponent';
  import { onMount } from 'svelte';
  import { PopupStore, PopupResult } from '$lib/systems/PopupStore';

  let page: InstanceType<typeof Page> & ITransitionComponent;

  onMount(async() => {
    await page.enter();
    await wait(1000);
    const result = await PopupStore.open({
      title: '是否要離開？',
      content: '你確定要回主畫面嗎？',
      buttons: [
        {
          text: '取消',
          className: 'cancelButton',
          onClick: () => PopupResult.Keep,
        },
        {
          text: '離開',
          className: 'confirmButton',
          onClick: () => PopupResult.Close,
        },
      ]
    });
    await page.leave();
  });

</script>

<Page bind:this={page} wrapperClass="splashScreen">
  <div class="logoBox enterFade">
    <img src="/assets/images/splashScreenLogo.png" alt="Splash Screen Logo" />
  </div>
</Page>

<link rel="stylesheet" href="/styles/animations.css" />
<style>
  :global(.splashScreen) {
    --background: #1e293b;

    display: flex;
    justify-content: center;
    align-items: center;

    color: white;
  }

  .logoBox {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;
  }

  .logoBox img {
    width: 50%;
  }
</style>
