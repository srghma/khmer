<script lang="ts">
  import SidebarHeader from '$lib/components/Sidebar/SidebarHeader.svelte';
  import SettingsView from '$lib/components/Settings/SettingsView.svelte';
  import AboutView from '$lib/components/About/AboutView.svelte';
  import { goto } from '$app/navigation';
  import { search } from '$lib/state/search.svelte';

  let showAbout = $state(false);

  search.activeTab = 'settings';
</script>

<div class="flex h-screen w-screen bg-content1 overflow-hidden font-inter text-foreground">
  <div class="flex flex-col bg-background border-r border-divider z-10 shadow-medium shrink-0 transition-all md:w-[25rem] lg:w-[28rem] max-md:max-w-full md:max-w-[40vw] pt-[env(safe-area-inset-top)] text-base">
    <SidebarHeader activeTab="settings" />

    <div class="flex-1 overflow-hidden relative">
       {#if showAbout}
         <AboutView onBack={() => showAbout = false} />
       {:else}
         <SettingsView onAboutClick={() => showAbout = true} />
       {/if}
    </div>
  </div>

  <div class="hidden md:flex flex-1 bg-background items-center justify-center text-muted-foreground p-8 text-center h-full">
     <!-- Last selected word or welcome -->
  </div>
</div>
