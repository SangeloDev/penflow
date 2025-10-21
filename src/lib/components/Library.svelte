<script lang="ts">
  import type { MarkdownFile } from "$lib/types";
  import { ArrowDown, ArrowUp, Clock, Eye, Paperclip, PencilIcon, Plus, Settings, Trash2Icon, X } from "lucide-svelte";
  import Modal from "./Modal.svelte";
  import { generateDocumentTitle } from "./Editor.svelte.ts";
  import { formatDistanceStrict } from "date-fns";
  import { setSettingsModalVisibility } from "./Editor.svelte.ts";
  import { settings } from "$lib/settings.svelte.ts";
  import { m } from "$paraglide/messages.js";

  let {
    files,
    onNewFile,
    onOpenFile,
    onDeleteFile,
    isLoading,
  }: {
    files: Record<string, MarkdownFile>;
    onNewFile: () => void;
    onOpenFile: (id: string) => void;
    onDeleteFile: (id: string) => void;
    isLoading: boolean;
  } = $props<{
    files: Record<string, MarkdownFile>;
    onNewFile: () => void;
    onOpenFile: (id: string) => void;
    onDeleteFile: (id: string) => void;
    isLoading: boolean;
  }>();

  let deleteModalVisible = $state(false);
  let fileToDelete = $state<string | null>(null);

  let searchTerm = $state("");

  // Reactive translations
  let libraryTitle = $state("");
  let libraryFiltersCreated = $state("");
  let libraryFiltersModified = $state("");
  let libraryFiltersVisited = $state("");
  let libraryFiltersName = $state("");
  let searchLibraryPlaceholder = $state("");
  let loadingLibraryMessage = $state("");
  let yourNotesTitle = $state("");
  let noNotesYetMessage = $state("");
  let createNoteButton = $state("");
  let newNoteButton = $state("");
  let noResultsFoundMessage = $state("");
  let confirmDeletionMessage = $state("");
  let cancelButton = $state("");
  let deleteButton = $state("");
  let creationDate = $state("");
  let modificationDate = $state("");
  let visitDate = $state("");
  let untitledNote = $state("");

  let confirmDeletionTitle = $state((item: string) => {
    return m.library_confirmDeletion_title({ item: item });
  });

  // function confirmDeletionTitle(item: string) {
  //   return m.library_confirmDeletion_title({ item: item });
  // }

  $effect(() => {
    libraryTitle = m.library();
    libraryFiltersCreated = m.library_filters_created();
    libraryFiltersModified = m.library_filters_modified();
    libraryFiltersVisited = m.library_filters_visited();
    libraryFiltersName = m.library_filters_name();
    searchLibraryPlaceholder = m.library_filters_search();
    loadingLibraryMessage = m.library_loading();
    yourNotesTitle = m.library_yourNotes();
    noNotesYetMessage = m.library_noNotes();
    createNoteButton = m.library_createNoteButton();
    newNoteButton = m.library_newNoteButton();
    noResultsFoundMessage = m.library_noResults();
    creationDate = m.library_note_creationDate();
    modificationDate = m.library_note_modificationDate();
    visitDate = m.library_note_visitDate();
    untitledNote = m.library_note_untitled();
    confirmDeletionMessage = m.library_confirmDeletion_message();
    cancelButton = m.cancel();
    deleteButton = m.delete();
  });

  const filteredFiles = $derived(
    Object.entries(files)
      .filter(([_id, file]) => {
        const title = file.title || generateDocumentTitle(file.content) || untitledNote || "Untitled";
        const tags = (file.tags as string) || "";
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const titleMatch = title.toLowerCase().includes(lowerCaseSearchTerm);
        const tagsMatch = tags.toLowerCase().includes(lowerCaseSearchTerm);

        return titleMatch || tagsMatch;
      })
      .sort(([_a, fileA], [_b, fileB]) => {
        if (settings.general.library.sort.by === "name") {
          const titleA = fileA.title || generateDocumentTitle(fileA.content) || untitledNote || "Untitled";
          const titleB = fileB.title || generateDocumentTitle(fileB.content) || untitledNote || "Untitled";
          return settings.general.library.sort.order === "asc"
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        }

        const a = fileA[settings.general.library.sort.by as "createdAt" | "updatedAt" | "visitedAt"];
        const b = fileB[settings.general.library.sort.by as "createdAt" | "updatedAt" | "visitedAt"];

        return settings.general.library.sort.order === "asc" ? a - b : b - a;
      })
  );

  function handleDeleteClick(id: string) {
    fileToDelete = id;
    deleteModalVisible = true;
  }

  function confirmDelete() {
    if (fileToDelete) {
      onDeleteFile(fileToDelete);
      fileToDelete = null;
    }
    deleteModalVisible = false;
  }

  function cancelDelete() {
    fileToDelete = null;
    deleteModalVisible = false;
  }

  function updateSortBy(event: Event) {
    const target = event.target as HTMLSelectElement;
    settings.general.library.sort.by = target.value as "createdAt" | "updatedAt" | "visitedAt" | "name";
  }

  function updateSortOrder(order: "asc" | "desc") {
    settings.general.library.sort.order = order;
  }
</script>

<svelte:head>
  <title>{libraryTitle} - Penflow</title>
</svelte:head>

<div class="border-base-400 bg-base-200 flex items-center gap-2 border-b p-2 select-none">
  <div class="flex items-center gap-1">
    <img draggable={false} class="ml-1 size-8" src="/assets/icon/hd_hi.ico" alt="logo" />
    <span class="py-1 align-middle text-xl font-bold">penflow</span>
  </div>
  <div class="ml-auto flex items-center gap-1">
    <button class="btn btn-square" onclick={() => setSettingsModalVisibility(true)} title="Settings">
      <Settings size={20} />
    </button>
  </div>
</div>
<div class="text-base-font mx-auto max-w-[1200px] p-8">
  <div class="mb-6">
    <h1 class="text-3xl font-bold">{libraryTitle}</h1>
    <div class="flex items-center gap-2">
      <div class="relative mt-3 mb-4 flex flex-1">
        <input
          class="input peer w-full !rounded-r-none"
          id="search"
          type="text"
          placeholder=" "
          bind:value={searchTerm}
        />
        <label for="search" class="label peer dark:!bg-base-150">{searchLibraryPlaceholder}</label>
        <select
          onchange={updateSortBy}
          value={settings.general.library.sort.by}
          class="input max-w-56 !rounded-l-none !border-l-0"
        >
          <option value="createdAt">{libraryFiltersCreated}</option>
          <option value="updatedAt">{libraryFiltersModified}</option>
          <option value="visitedAt">{libraryFiltersVisited}</option>
          <option value="name">{libraryFiltersName}</option>
        </select>
      </div>
      <div class="mt-3 mb-4 flex items-center gap-1">
        <button
          onclick={() => updateSortOrder("asc")}
          class="btn btn-square"
          aria-pressed={settings.general.library.sort.order === "asc"}
        >
          <ArrowUp size={18} />
        </button>
        <button
          onclick={() => updateSortOrder("desc")}
          class="btn btn-square"
          aria-pressed={settings.general.library.sort.order === "desc"}
        >
          <ArrowDown size={18} />
        </button>
      </div>
    </div>
    <hr class="text-base-400" />
  </div>

  {#if isLoading}
    <p class="flex items-center gap-2">
      <span
        class="border-b-base-font border-r-base-font block size-4 animate-spin rounded-full border-2 border-transparent"
      ></span>
      {loadingLibraryMessage || "Loading library..."}
    </p>
  {:else}
    <div>
      <div class="flex items-center gap-2 pb-4">
        <Paperclip size={18} />
        <h2 class="text-xl">{yourNotesTitle} ({filteredFiles.length})</h2>
      </div>
      {#if Object.keys(files).length === 0}
        <div class="card p-12">
          <p class="pb-4 text-center italic opacity-50">{noNotesYetMessage}</p>
          <button class="btn btn-primary mx-auto pb-12" onclick={onNewFile}>{createNoteButton}</button>
        </div>
      {:else if filteredFiles.length === 0}
        <div class="card p-12">
          <p class="text-center italic opacity-50">{noResultsFoundMessage}</p>
        </div>
      {:else}
        <div class="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          <button class="card card-link card-primary h-min min-h-32" onclick={onNewFile}>
            <div class="flex w-full items-center justify-center gap-2 text-xl"><Plus size={24} /> {newNoteButton}</div>
          </button>
          {#each filteredFiles as [id, file] (id)}
            <div
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenFile(id);
                }
              }}
              class="card card-link relative flex h-min min-h-32 flex-col gap-2 overflow-hidden"
              onclick={() => onOpenFile(id)}
            >
              <div class="mt-auto flex flex-col gap-2">
                <h3 class="line-clamp-1 text-center">
                  {file.title || generateDocumentTitle(file.content) || untitledNote || "Untitled"}
                </h3>
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(id);
                  }}
                  class="btn btn-square absolute top-0 right-0"
                  title="Delete"
                >
                  <X size={16} />
                </button>
              </div>

              <div class="mt-auto flex flex-col items-center place-self-center justify-self-center text-xs opacity-50">
                <span class="flex items-center gap-1">
                  <Clock size={13} />
                  {creationDate}: {formatDistanceStrict(file.createdAt, new Date(), { addSuffix: true })}
                </span>
                <span class="flex items-center gap-1">
                  <PencilIcon size={13} />
                  {modificationDate}: {formatDistanceStrict(file.updatedAt, new Date(), {
                    addSuffix: true,
                  })}
                </span>
                <span class="flex items-center gap-1">
                  <Eye size={13} />
                  {visitDate}: {formatDistanceStrict(file.visitedAt, new Date(), { addSuffix: true })}
                </span>
              </div>

              {#if file.tags}
                <div class="flex flex-wrap justify-center gap-1">
                  {#each [...new Set((file.tags as string).split(", "))] as tag (tag)}
                    <span class="bg-primary rounded-full px-2 text-sm text-white">{tag}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if fileToDelete && files[fileToDelete]}
  <Modal bind:show={deleteModalVisible} onclose={cancelDelete} className="!min-h-max">
    {#snippet header()}
      <Trash2Icon size={18} />
      {#if fileToDelete && files[fileToDelete]}
        <span class="mr-4">
          {confirmDeletionTitle(
            files[fileToDelete].title ||
              generateDocumentTitle(files[fileToDelete].content) ||
              untitledNote ||
              "Untitled"
          )}
        </span>
      {/if}
    {/snippet}
    <p class="mb-4 max-w-[50ch]">{confirmDeletionMessage}</p>
    <br />
    <br />
    <div class="absolute right-4 bottom-4 flex justify-end gap-2">
      <button onclick={() => cancelDelete()} class="btn btn-outline">{cancelButton}</button>
      <button onclick={() => confirmDelete()} class="btn btn-danger">{deleteButton}</button>
    </div>
  </Modal>
{/if}
