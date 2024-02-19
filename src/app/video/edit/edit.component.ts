import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ModalService } from '../../services/modal.service';
import Clip from '../../models/clip.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClipService } from '../../services/clip.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css',
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() activeClip: Clip | null = null;
  @Output() update = new EventEmitter<Clip>();

  editForm = new FormGroup({
    clipId: new FormControl('', { nonNullable: true }),
    title: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
  });

  alertColor = 'blue';
  alertMessage = 'Please wait! Updating clip.';
  inSubmission = false;
  showAlert = false;

  constructor(private modal: ModalService, private clipService: ClipService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.activeClip) return;
    this.editForm.controls.title.setValue(this.activeClip?.title);
    this.editForm.controls.clipId.setValue(
      this.activeClip?.documentId as string
    );
    this.inSubmission = false;
    this.showAlert = false;
    this.editForm.enable();
  }

  ngOnInit(): void {
    this.modal.register('editClip');
  }

  ngOnDestroy(): void {
    this.modal.unregister('editClip');
  }

  async submitForm() {
    if (!this.activeClip) return;

    this.editForm.disable();
    this.alertColor = 'blue';
    this.alertMessage = 'Please wait! Updating clip.';
    this.inSubmission = true;
    this.showAlert = true;

    const { clipId, title } = this.editForm.controls;

    try {
      await this.clipService.updateClip(clipId.value, title.value);
    } catch {
      this.alertColor = 'red';
      this.alertMessage = 'Something went wrong. Please try again later.';
      this.inSubmission = false;
      this.editForm.enable();

      return;
    }

    this.alertColor = 'green';
    this.alertMessage = 'Success! Your clip has been updated.';
    this.inSubmission = false;

    this.activeClip.title = title.value;
    this.update.emit(this.activeClip);
  }
}
