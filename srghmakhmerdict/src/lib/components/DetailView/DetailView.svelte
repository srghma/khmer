<script lang="ts">
  import { settings } from '$lib/state/settings';
  import { favorites } from '$lib/state/favorites';
  import * as m from '$paraglide/messages';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import DetailHeader from './DetailHeader.svelte';
  import { onMount } from 'svelte';
  import { getWordDetailByMode } from '$lib/db/dict/details';

  let { word, mode, backButton_goBack } = $props();

  let detail = $state<any>(undefined);
  let loading = $state(true);

  let isFav = $derived(favorites.isFavorite(word, mode));

  async function toggleFav() {
    await favorites.toggle(word, mode);
  }

  $effect(() => {
    if (word && mode) {
      loadDetail();
    }
  });

  async function loadDetail() {
    loading = true;
    try {
      detail = await getWordDetailByMode(mode, word, false);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex flex-col h-full bg-background relative">
  <DetailHeader {word} {mode} {backButton_goBack} {isFav} {toggleFav} />

  <ScrollArea class="flex-1">
    <div class="p-6 space-y-8 max-w-4xl mx-auto">
      {#if loading}
        <div class="flex items-center justify-center p-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      {:else if detail}
        <div class="p-6 bg-muted/20 rounded-2xl border border-divider">
          <h2 class="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {m.DETAIL_SECTION_DEFINITION()}
          </h2>
          <div class="prose prose-slate dark:prose-invert max-w-none">
            {@html detail.html || JSON.stringify(detail)}
          </div>
        </div>
      {:else}
        <div class="p-12 text-center text-muted-foreground">
          {m.DETAIL_NOT_FOUND({ word })}
        </div>
      {/if}
    </div>
  </ScrollArea>
</div>
