<script lang="ts">
  import { wait } from '$lib/utils/Wait';
  import Page from '$lib/components/Page.svelte';
  import { PopupStore, PopupResult } from '$lib/systems/PopupStore';
  import Image from '$lib/components/Image.svelte';
  import { AudioManager } from '$lib/systems/AudioManager';
  
  async function main() {
    AudioManager.initialize();
    await wait(1000);
    const result = await PopupStore.open({
      title: '歡迎光臨「Knight Base」！',
      content: '本遊戲為一個框架示範遊戲，主要是以一個具有基本遊戲流程來做設計，處理掉一些在各個平台會踩到的坑，讓做新遊戲變得更簡單。來看看這裡面究竟有什麼吧！',
      buttons: [
        {
          text: '確認',
          className: 'confirmButton',
          onClickEvent: {
            handler: () => {
            AudioManager.resumeContext();
            return PopupResult.Close;
          }},
        },
      ]
    });
    return "/title";
  }
</script>

<Page mainProgress={main} wrapperClass="splashScreen">
  <div class="logoSection">
    <div class="logoBox enterFade">
      <Image key="splashScreenLogo" alt="Splash Screen Logo" className="logo" />
    </div>
  </div>
</Page>

<style>
  :global(.splashScreen) {
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
  }

  .logoSection {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logoBox {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 50%;
    height: 100px;
  }

  .logoBox :global(.logo) {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
