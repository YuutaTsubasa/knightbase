<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import Image from "$lib/components/Image.svelte";
  import Page from "$lib/components/Page.svelte";
  import Button from "$lib/components/Button.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { BACK_PATH } from "$lib/utils/Constant";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { Coins, Diamond, Gem } from "lucide-svelte";

  $: topbarHeight = 0;
  let activeTab: 'coin' | 'diamond' | 'ruby' = 'coin';

  // Mock shop data
  $: shops = {
    coin: [
      {
        id: 1,
        nameKey: "smallHealingPotion",
        descriptionKey: "smallHealingPotionDesc",
        iconKey: "healingPotion",
        price: 100,
        currency: "coin"
      },
      {
        id: 2,
        nameKey: "ironSword",
        descriptionKey: "ironSwordDesc", 
        iconKey: "ironSword",
        price: 500,
        currency: "coin"
      },
      {
        id: 3,
        nameKey: "leatherArmor",
        descriptionKey: "leatherArmorDesc",
        iconKey: "leatherArmor", 
        price: 800,
        currency: "coin"
      }
    ],
    diamond: [
      {
        id: 4,
        nameKey: "premiumHealingPotion",
        descriptionKey: "premiumHealingPotionDesc",
        iconKey: "premiumPotion",
        price: 10,
        currency: "diamond"
      },
      {
        id: 5,
        nameKey: "experienceBooster",
        descriptionKey: "experienceBoosterDesc",
        iconKey: "expBooster",
        price: 25,
        currency: "diamond"
      },
      {
        id: 6,
        nameKey: "rareWeapon",
        descriptionKey: "rareWeaponDesc",
        iconKey: "rareWeapon",
        price: 100,
        currency: "diamond"
      }
    ],
    ruby: [
      {
        id: 7,
        nameKey: "legendaryArtifact",
        descriptionKey: "legendaryArtifactDesc",
        iconKey: "legendaryArtifact",
        price: 5,
        currency: "ruby"
      },
      {
        id: 8,
        nameKey: "mysticalCharm",
        descriptionKey: "mysticalCharmDesc",
        iconKey: "mysticalCharm",
        price: 15,
        currency: "ruby"
      },
      {
        id: 9,
        nameKey: "ancientRelic",
        descriptionKey: "ancientRelicDesc",
        iconKey: "ancientRelic",
        price: 50,
        currency: "ruby"
      }
    ]
  };

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/mainmenu";
  }

  function setActiveTab(tab: 'coin' | 'diamond' | 'ruby') {
    activeTab = tab;
  }

  async function purchaseItem(item: any) {
    const result = await PopupStore.open({
      title: $t("confirmPurchase"),
      content: $t("confirmPurchaseContent", { 
        item: $t(item.nameKey), 
        price: item.price, 
        currency: $t(item.currency) 
      }),
      buttons: [
        {
          text: $t("cancel"),
          onClick: () => PopupResult.Close
        },
        {
          text: $t("purchase"),
          onClick: () => {
            console.log(`Purchased ${item.nameKey} for ${item.price} ${item.currency}`);
            return PopupResult.Close;
          }
        }
      ]
    });
  }

  function getCurrencyIcon(currency: string) {
    switch (currency) {
      case 'coin': return Coins;
      case 'diamond': return Diamond;
      case 'ruby': return Gem;
      default: return Coins;
    }
  }

  function getCurrencyColor(currency: string) {
    switch (currency) {
      case 'coin': return '#fbbf24';
      case 'diamond': return '#3b82f6';
      case 'ruby': return '#ef4444';
      default: return '#fbbf24';
    }
  }
</script>

<Page mainProgress={main} 
  wrapperStyle="position: relative; background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;"
  contentStyle="box-sizing: border-box; height: 100vh;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('shop')} 
      secondaryTitle={$t('shopPageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set(BACK_PATH)} />
  </slot>
  
  <div class="shopPage" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="shopTabs">
      <button 
        class="shopTab {activeTab === 'coin' ? 'active' : ''}"
        on:click={() => setActiveTab('coin')}>
        <svelte:component this={Coins} size={24} />
        <span>{$t('coinShop')}</span>
      </button>
      <button 
        class="shopTab {activeTab === 'diamond' ? 'active' : ''}"
        on:click={() => setActiveTab('diamond')}>
        <svelte:component this={Diamond} size={24} />
        <span>{$t('diamondShop')}</span>
      </button>
      <button 
        class="shopTab {activeTab === 'ruby' ? 'active' : ''}"
        on:click={() => setActiveTab('ruby')}>
        <svelte:component this={Gem} size={24} />
        <span>{$t('rubyShop')}</span>
      </button>
    </div>
    
    <div class="shopContent">
      <div class="itemGrid">
        {#each shops[activeTab] as item (item.id)}
          <div class="shopItem">
            <div class="itemIcon">
              <Image key={item.iconKey} alt={$t(item.nameKey)} className="itemImage" />
            </div>
            <div class="itemInfo">
              <h3 class="itemName" style={FontAssets.getCssStyle("titleBold")}>
                {$t(item.nameKey)}
              </h3>
              <p class="itemDescription">
                {$t(item.descriptionKey)}
              </p>
              <div class="itemPrice">
                <svelte:component 
                  this={getCurrencyIcon(item.currency)} 
                  size={16} 
                  style="color: {getCurrencyColor(item.currency)}" />
                <span class="priceAmount" style="color: {getCurrencyColor(item.currency)}">
                  {item.price}
                </span>
              </div>
              <div class="itemActions">
                <Button 
                  label={$t('purchase')} 
                  onClick={() => purchaseItem(item)}
                  className="purchaseButton" />
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</Page>

<style>
  .shopPage {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: var(--topbarHeight, 0px);
    box-sizing: border-box;
  }

  .shopTabs {
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 2px solid #e2e8f0;
    padding: 0 1rem;
  }

  .shopTab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #64748b;
    transition: all 0.2s ease;
    border-bottom: 3px solid transparent;
  }

  .shopTab:hover {
    color: #1e293b;
    background: rgba(0, 0, 0, 0.05);
  }

  .shopTab.active {
    color: #1e293b;
    border-bottom-color: #3b82f6;
    font-weight: bold;
  }

  .shopContent {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .itemGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .shopItem {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s ease;
  }

  .shopItem:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .itemIcon {
    height: 120px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .itemIcon :global(.itemImage) {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }

  .itemInfo {
    padding: 1rem;
  }

  .itemName {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .itemDescription {
    margin: 0 0 1rem 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .itemPrice {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .priceAmount {
    font-size: 1.25rem;
    font-weight: bold;
  }

  .itemActions {
    display: flex;
    justify-content: center;
  }

  .itemActions :global(.purchaseButton) {
    width: 100%;
    padding: 0.75rem;
  }
</style>