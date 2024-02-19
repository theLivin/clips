import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
  // providers: [ModalService]
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() modalId = '';

  constructor(public modal: ModalService, private ref: ElementRef) {}

  ngOnInit(): void {
    document.body.appendChild(this.ref.nativeElement);
  }

  ngOnDestroy(): void {
    document.body.removeChild(this.ref.nativeElement);
  }

  closeModal() {
    this.modal.toggleModal(this.modalId);
  }
}
