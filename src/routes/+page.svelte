<script lang="ts">
  import { wait } from '$lib/utils/Wait';
  import Page from '$lib/components/Page.svelte';
  import { PopupStore, PopupResult } from '$lib/systems/PopupStore';
  import Image from '$lib/components/Image.svelte';
  import { AudioManager } from '$lib/systems/AudioManager';
  import { t } from '$lib/assets/LocalizationAssets';
  
  async function main() {
    AudioManager.initialize();
    await wait(1000);
    const result = await PopupStore.open({
      title: $t("welcomeTitle"),
      content: $t("welcomeContent"),
      buttons: [
        {
          text: $t("confirm"),
          onClick: () => {
            return PopupResult.Close;
          },
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
    width: 100%;
    height: 100%;
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
