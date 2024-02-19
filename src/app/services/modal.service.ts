import { Injectable } from '@angular/core';

interface Modal {
  id: string;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modals: Modal[] = [];

  constructor() {}

  register(id: string) {
    this.modals.push({ id, isVisible: false });
  }

  unregister(id: string) {
    this.modals = this.modals.filter((modal) => modal.id !== id);
  }

  isModalOpen(id: string) {
    return !!this.modals.find((modal) => modal.id === id)?.isVisible;
  }

  toggleModal(id: string) {
    const modal = this.modals.find((modal) => modal.id === id);

    if (modal) {
      modal.isVisible = !modal.isVisible;
    }
  }
}
