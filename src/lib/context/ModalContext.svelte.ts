/**
 * Modal Context
 *
 * Provides modal state management through Svelte's context API.
 * Manages visibility state for various modals in the application.
 */

import { getContext, setContext } from "svelte";
import { ContextNotFoundError } from "$lib/errors";

const MODAL_CONTEXT_KEY = Symbol("modal");

/**
 * Modal types in the application
 */
export type ModalType = "shortcuts" | "settings" | "welcome" | "confirm";

/**
 * Modal state for a single modal
 */
interface ModalState {
  visible: boolean;
  data?: any;
}

/**
 * Modal context state and operations
 */
export class ModalContext {
  private modals = $state<Record<ModalType, ModalState>>({
    shortcuts: { visible: false },
    settings: { visible: false },
    welcome: { visible: false },
    confirm: { visible: false },
  });

  /**
   * Show a modal
   */
  show(modalType: ModalType, data?: any): void {
    this.modals[modalType] = { visible: true, data };
  }

  /**
   * Hide a modal
   */
  hide(modalType: ModalType): void {
    this.modals[modalType] = { visible: false, data: undefined };
  }

  /**
   * Toggle a modal's visibility
   */
  toggle(modalType: ModalType, data?: any): void {
    if (this.modals[modalType].visible) {
      this.hide(modalType);
    } else {
      this.show(modalType, data);
    }
  }

  /**
   * Check if a modal is visible
   */
  isVisible(modalType: ModalType): boolean {
    return this.modals[modalType].visible;
  }

  /**
   * Get modal data
   */
  getData(modalType: ModalType): any {
    return this.modals[modalType].data;
  }

  /**
   * Hide all modals
   */
  hideAll(): void {
    (Object.keys(this.modals) as ModalType[]).forEach((modalType) => {
      this.hide(modalType);
    });
  }

  /**
   * Get the visibility state of a modal (for binding)
   */
  getVisibilityState(modalType: ModalType): boolean {
    return this.modals[modalType].visible;
  }

  /**
   * Set the visibility state of a modal (for binding)
   */
  setVisibilityState(modalType: ModalType, visible: boolean): void {
    if (visible) {
      this.show(modalType);
    } else {
      this.hide(modalType);
    }
  }

  /**
   * Show shortcuts modal
   */
  showShortcuts(): void {
    this.show("shortcuts");
  }

  /**
   * Hide shortcuts modal
   */
  hideShortcuts(): void {
    this.hide("shortcuts");
  }

  /**
   * Show settings modal
   */
  showSettings(): void {
    this.show("settings");
  }

  /**
   * Hide settings modal
   */
  hideSettings(): void {
    this.hide("settings");
  }

  /**
   * Show welcome modal
   */
  showWelcome(): void {
    this.show("welcome");
  }

  /**
   * Hide welcome modal
   */
  hideWelcome(): void {
    this.hide("welcome");
  }

  /**
   * Show confirm dialog with data
   */
  showConfirm(data: { title?: string; message: string; onConfirm: () => void; onCancel?: () => void }): void {
    this.show("confirm", data);
  }

  /**
   * Hide confirm dialog
   */
  hideConfirm(): void {
    this.hide("confirm");
  }
}

/**
 * Set the modal context
 */
export function setModalContext(): ModalContext {
  const context = new ModalContext();
  setContext(MODAL_CONTEXT_KEY, context);
  return context;
}

/**
 * Get the modal context
 */
export function getModalContext(): ModalContext {
  const context = getContext<ModalContext>(MODAL_CONTEXT_KEY);
  if (!context) {
    throw new ContextNotFoundError("ModalContext");
  }
  return context;
}
