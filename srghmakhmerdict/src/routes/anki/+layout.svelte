<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Settings, X } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import * as m from '$paraglide/messages';

  let { children } = $props();

  function handleExit() {
    goto('/en');
  }
</script>

<div class="flex flex-col h-full bg-background overflow-hidden">
  <header class="flex items-center gap-2 p-2 border-b border-divider bg-background/80 backdrop-blur-md z-20 pt-[calc(0.5rem+env(safe-area-inset-top))]">
    <Button variant="ghost" size="icon" onclick={handleExit}>
      <X class="h-6 w-6" />
    </Button>

    <Tabs value={$page.params.lang || 'en'} class="flex-1">
      <TabsList class="w-full bg-transparent h-12">
        <TabsTrigger value="en" class="flex-1 h-full">🇬🇧</TabsTrigger>
        <TabsTrigger value="km" class="flex-1 h-full">🇰🇭</TabsTrigger>
        <TabsTrigger value="ru" class="flex-1 h-full">🇷🇺</TabsTrigger>
      </TabsList>
    </Tabs>

    <Button variant="ghost" size="icon" onclick={() => goto('/anki/settings/general')}>
      <Settings class="h-6 w-6" />
    </Button>
  </header>

  <main class="flex-1 overflow-hidden relative">
    {@render children()}
  </main>
</div>
