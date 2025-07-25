<script lang="ts">
  import { wait } from '$lib/utils/Wait';
  import Page from '$lib/components/Page.svelte';
  import { PopupStore, PopupResult } from '$lib/systems/PopupStore';
  import Image from '$lib/components/Image.svelte';
  
  async function main() {
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
    return "/title";
  }
</script>

<Page mainProgress={main} wrapperClass="splashScreen">
  <div class="logoBox enterFade">
    <Image key="splashScreenLogo" alt="Splash Screen Logo" className="logo" />
  </div>
</Page>

<style>
  :global(.splashScreen) {
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

  .logoBox :global(.logo) {
    width: 50%;
  }
</style>
