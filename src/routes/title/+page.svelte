<script>
  import Page from "$lib/components/Page.svelte";
  import Image from "$lib/components/Image.svelte";
  import { wait } from "$lib/utils/Wait";
  import Video from "$lib/components/Video.svelte";

  async function main() {
    await wait(5000);
    return "/";
  }
</script>

<Page mainProgress={main} wrapperClass="titlePage">
  <div class="videoBackground" slot="outside">
    <Video key="titleBackground" />
  </div>

  <div class="overlay">
    <Image className="gameLogo" key="gameLogo" />
    <div class="pressStart">PRESS TO START</div>
  </div>
</Page>

<style>
  :global(.titlePage) {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .videoBackground :global(video) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
  }

  .overlay {
    backdrop-filter: blur(4px);
    background: rgba(0, 0, 0, 0.5);
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }

  .overlay :global(.gameLogo) {
    max-height: 40vh;
  }

  .pressStart {
    background: #0007cd;
    color: white;
    width: 80%;
    text-align: center;
    font-weight: bold;
    line-height: 0.9;
    font-size: 1.3rem;
  }
</style>