<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { search } from '$lib/state/search';
  import { settings } from '$lib/state/settings';
  import * as m from '$paraglide/messages';
  import { Search, X } from 'lucide-svelte';

  let { activeTab } = $props();

  const numberFormatter = new Intl.NumberFormat('en-US');

  let placeholder = $derived(() => {
    switch (settings.searchMode.value) {
      case 'regex': return m.SEARCH_PLACEHOLDER_REGEX();
      case 'includes': return m.SEARCH_PLACEHOLDER_INCLUDES();
      default: return m.SEARCH_PLACEHOLDER_STARTS_WITH();
    }
  });

  function handleClear() {
    search.query = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && search.query.trim()) {
      // Handle enter action if needed
    }
  }
</script>

<div class="relative group">
  <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
    <Search class="h-4 w-4" />
  </div>

  <Input
    bind:value={search.query}
    onkeydown={handleKeyDown}
    placeholder={placeholder()}
    class="pl-10 pr-20 h-10 border-none rounded-none focus-visible:ring-0"
  />

  <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
    {#if search.query}
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
        onclick={handleClear}
      >
        <X class="h-4 w-4" />
      </Button>
    {/if}

    {#if search.totalCount > 0}
      <span class="text-xs font-mono text-muted-foreground tabular-nums">
        {numberFormatter.format(search.totalCount)}
      </span>
    {/if}
  </div>
</div>
