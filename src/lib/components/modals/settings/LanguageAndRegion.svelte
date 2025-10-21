<script lang="ts">
  import { getLocale, locales, setLocale, type Locale } from "$paraglide/runtime";
  import langs from "$lib/data/langs.json";
  import SettingsItem from "./SettingsItem.svelte";
  import { m } from "$paraglide/messages";

  let selectedLocale: Locale = $state(getLocale());

  function setNewLocale(locale: Locale) {
    setLocale(locale, { reload: false });
  }
</script>

<SettingsItem>
  {#snippet title()}{m.settings_i18n_languageItem_title()}{/snippet}
  {#snippet description()}{m.settings_i18n_languageItem_description()}{/snippet}
</SettingsItem>

<select class="input max-w-min" bind:value={selectedLocale} onchange={() => setNewLocale(selectedLocale)}>
  <option disabled>{m.settings_i18n_languageItem_selectLang()}</option>
  {#each locales as l (l)}
    {#if langs[l]}
      <option value={l}>{langs[l].name} {langs[l].flag}</option>
    {/if}
  {/each}
</select>
