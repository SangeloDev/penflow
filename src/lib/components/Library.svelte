<script lang="ts">
  import type { MarkdownFile } from "$lib/types";
  import { Clock, Eye, Paperclip, PencilIcon, Plus, Settings, Trash2Icon, X } from "lucide-svelte";
  import Modal from "./Modal.svelte";
  import { generateDocumentTitle } from "./Editor.svelte.ts";
  import { formatDistanceStrict } from "date-fns";
  import { setSettingsModalVisibility } from "./Editor.svelte.ts";

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

  function handleDeleteClick(id: string) {
    fileToDelete = id;
    setDeleteModalVisible(true);
  }

  function confirmDelete() {
    if (fileToDelete) {
      onDeleteFile(fileToDelete);
      fileToDelete = null;
    }
    setDeleteModalVisible(false);
  }

  function cancelDelete() {
    fileToDelete = null;
    setDeleteModalVisible(false);
  }

  function setDeleteModalVisible(value: boolean) {
    deleteModalVisible = value;
  }
</script>

<svelte:head>
  <title>Library - Penflow</title>
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
    <h1 class="text-3xl font-bold">Library</h1>
    <div class="relative mt-3 mb-4">
      <input class="input peer" id="search" type="text" placeholder=" " />
      <label for="search" class="label peer dark:!bg-base-150">Search library...</label>
    </div>
    <hr class="text-base-400" />
  </div>

  {#if isLoading}
    <p class="flex items-center gap-2">
      <span
        class="border-b-base-font border-r-base-font block size-4 animate-spin rounded-full border-2 border-transparent">
      </span>
      Loading library...
    </p>
  {:else}
    <div>
      <div class="flex items-center gap-2 pb-4">
        <Paperclip size={18} />
        <h2 class="text-xl">Your notes ({Object.keys(files).length})</h2>
      </div>
      {#if Object.keys(files).length === 0}
        <div class="card p-12">
          <p class="pb-4 text-center italic opacity-50">No notes yet. Create your first note now!</p>
          <button class="btn btn-primary mx-auto pb-12" onclick={onNewFile}>Create note</button>
        </div>
      {:else}
        <div class="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          <button class="card card-link card-primary" onclick={onNewFile}>
            <div class="flex w-full items-center justify-center gap-2 text-xl"><Plus size={24} /> New Note</div>
          </button>
          {#each Object.entries(files) as [id, file] (id)}
            <div
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenFile(id);
                }
              }}
              class="card card-link relative flex h-32 flex-col gap-2"
              onclick={() => onOpenFile(id)}>
              <div class="mt-auto">
                <h3 class="text-center">{generateDocumentTitle(file.content) || "Untitled"}</h3>
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(id);
                  }}
                  class="btn btn-square absolute top-0 right-0"
                  title="Delete">
                  <X size={16} />
                </button>
              </div>

              <div class="mt-auto flex flex-col items-center place-self-center justify-self-center text-xs opacity-50">
                <span class="flex items-center gap-1">
                  <Clock size={13} /> Created: {formatDistanceStrict(file.createdAt, new Date(), { addSuffix: true })}
                </span>
                <span class="flex items-center gap-1">
                  <PencilIcon size={13} /> Updated: {formatDistanceStrict(file.updatedAt, new Date(), {
                    addSuffix: true,
                  })}
                </span>
                <span class="flex items-center gap-1">
                  <Eye size={13} /> Visited: {formatDistanceStrict(file.visitedAt, new Date(), { addSuffix: true })}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<Modal bind:show={deleteModalVisible} onclose={cancelDelete}>
  {#snippet header()}
    <Trash2Icon size={18} />
    <span>Confirm Deletion</span>
  {/snippet}

  <p class="mb-4">Are you sure you want to delete this file? This action cannot be undone.</p>
  {#if fileToDelete && files[fileToDelete]}
    <p class="mb-4 text-sm text-gray-600">
      <strong>File preview</strong>
      <br />
      {files[fileToDelete].content.substring(0, 50) || "Untitled"}...
    </p>
  {/if}
  <div class="flex justify-end gap-2">
    <button onclick={() => cancelDelete()} class="rounded border px-4 py-2 hover:bg-gray-100">Cancel</button>
    <button onclick={() => confirmDelete()} class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
      Delete
    </button>
  </div>
</Modal>
