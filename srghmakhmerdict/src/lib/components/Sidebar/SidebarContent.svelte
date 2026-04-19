<script lang="ts">
  import { search } from '$lib/state/search';
  import VirtualList from 'svelte-tiny-virtual-list';
  import * as m from '$paraglide/messages';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let listItems = $derived([...(search.resultData || []), ...search.contentMatches]);

  function handleWordClick(word: string) {
    const lang = $page.params.lang || 'en';
    const prefix = $page.url.pathname.startsWith('/history') ? '/history' :
                   $page.url.pathname.startsWith('/favorites') ? '/favorites' : '';
    goto(`${prefix}/${lang}/${encodeURIComponent(word)}`);
  }
</script>

<div class="flex-1 overflow-hidden relative">
  {#if search.isSearching}
     <div class="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
       <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
     </div>
  {/if}

  {#if listItems.length > 0}
    <VirtualList
      height="100%"
      width="100%"
      itemCount={listItems.length}
      itemSize={50}
    >
      {#snippet item({ index, style })}
        <div
          {style}
          role="button"
          tabindex="0"
          class="px-4 flex items-center border-b border-divider hover:bg-muted cursor-pointer transition-colors overflow-hidden whitespace-nowrap text-ellipsis {$page.params.word === listItems[index] ? 'bg-warning/20' : ''}"
          onclick={() => handleWordClick(listItems[index])}
          onkeydown={(e) => e.key === 'Enter' && handleWordClick(listItems[index])}
        >
          {listItems[index]}
        </div>
      {/snippet}
    </VirtualList>
  {:else}
    <div class="p-8 text-center text-muted-foreground">
      {m.COMMON_NO_ITEMS_FOUND()}
    </div>
  {/if}
</div>
