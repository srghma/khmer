<script lang="ts">
  import { settings } from '$lib/state/settings';
  import { search } from '$lib/state/search';
  import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import SearchBar from './SearchBar.svelte';
  import * as m from '$paraglide/messages';
  import { History, Star, Settings as SettingsIcon } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let { activeTab } = $props();

  function handleTabChange(v: string) {
    if (v === 'history' || v === 'favorites') {
        goto(`/${v}/en`);
    } else if (v === 'settings') {
        goto('/settings');
    } else {
        goto(`/${v}`);
    }
  }
</script>

<div class="flex flex-col bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-divider">
  <div class="px-2 pt-2">
    <Tabs value={activeTab} onValueChange={handleTabChange} class="w-full">
      <TabsList class="w-full justify-start border-b rounded-none bg-background h-auto py-1">
        <TabsTrigger value="en" class="flex-1 font-bold text-lg">🇬🇧</TabsTrigger>
        <TabsTrigger value="km" class="flex-1 font-bold text-lg">🇰🇭</TabsTrigger>
        <TabsTrigger value="ru" class="flex-1 font-bold text-lg">🇷🇺</TabsTrigger>
        <TabsTrigger value="history" class="flex-1">
          <History class="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger value="favorites" class="flex-1">
          <Star class="h-5 w-5" />
        </TabsTrigger>
        <TabsTrigger value="settings" class="flex-1">
          <SettingsIcon class="h-5 w-5" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  </div>

  <div class="border-b border-divider/50 bg-background">
    <SearchBar {activeTab} />
  </div>
</div>
