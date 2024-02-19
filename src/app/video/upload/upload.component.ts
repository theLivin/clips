import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { switchMap, combineLatest, forkJoin } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { ClipService } from '../../services/clip.service';
import { Router } from '@angular/router';
import Clip from '../../models/clip.model';
import { FfmpegService } from '../../services/ffmpeg.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
})
export class UploadComponent implements OnDestroy {
  isDragover = false;
  file: File | null = null;
  task?: AngularFireUploadTask;
  screenshots: string[] = [];
  selectedScreenshot: string = '';
  screenshotTask?: AngularFireUploadTask;

  title = new FormControl('', {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });

  uploadForm = new FormGroup({
    title: this.title,
  });

  alertColor = 'blue';
  alertMessage = 'Please wait! Your clip is being uploaded.';
  inSubmission = false;
  showAlert = false;
  progressPercent = 0;
  showProgressPercent = false;
  showError = false;

  user: firebase.User | null = null;

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    this.auth.user.subscribe((user) => {
      this.user = user;
    });

    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
    this.task?.cancel();
  }

  async storeFile(event: Event) {
    if (this.ffmpegService.isRunning) return;

    this.isDragover = false;

    if ((event as DragEvent).dataTransfer) {
      this.file = (event as DragEvent).dataTransfer?.['files'].item(0) ?? null;
    } else if (event.target as HTMLInputElement) {
      this.file = (event.target as HTMLInputElement)['files']?.item(0) ?? null;
    }

    this.showAlert = false;

    if (!this.file || this.file.type !== 'video/mp4') {
      this.file = null;
      this.title.setValue('');
      this.showError = true;
      return;
    }

    this.screenshots = await this.ffmpegService.getScreenshots(this.file);
    this.selectedScreenshot = this.screenshots[0];

    this.showError = false;
    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
  }

  async uploadFile() {
    this.uploadForm.disable();

    this.alertColor = 'blue';
    this.alertMessage = 'Please wait! Your clip is being uploaded.';
    this.inSubmission = true;
    this.showAlert = true;
    this.showProgressPercent = true;

    const clipFileName = `${uuid()}`;
    const clipPath = `clips/${clipFileName}.mp4`;

    const screenshotBlob = await this.ffmpegService.blobFromUrl(
      this.selectedScreenshot
    );
    const screenshotPath = `screenshots/${clipFileName}.png`;

    this.task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath);
    const screenshotRef = this.storage.ref(screenshotPath);

    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);

    combineLatest([
      this.task.percentageChanges(),
      this.screenshotTask.percentageChanges(),
    ]).subscribe((progress) => {
      const [clipProgress, screenshotProgress] = progress;

      if (!clipProgress || !screenshotProgress) return;

      const total = clipProgress + screenshotProgress;
      this.progressPercent = total / 200;
    });

    forkJoin([
      this.task.snapshotChanges(),
      this.screenshotTask.snapshotChanges(),
    ])
      .pipe(
        switchMap(() =>
          forkJoin([clipRef.getDownloadURL(), screenshotRef.getDownloadURL()])
        )
      )
      .subscribe({
        next: async (urls) => {
          const [clipUrl, screenshotUrl] = urls;

          const clip: Clip = {
            uid: this.user?.uid as string,
            displayName: this.user?.displayName as string,
            title: this.title.value,
            fileName: `${clipFileName}.mp4`,
            url: clipUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            screenshotUrl: screenshotUrl,
            screenshotFileName: `${clipFileName}.png`,
          };

          const clipDocRef = await this.clipService.createClip(clip);

          this.alertColor = 'green';
          this.alertMessage =
            'Success! Your clip ready to be shared with the world!';
          this.inSubmission = false;
          this.showProgressPercent = false;

          this.file = null;
          this.title.setValue('');

          setTimeout(() => {
            this.router.navigate(['clips', clipDocRef.id]);
          }, 1000);
        },
        error: (error) => {
          this.uploadForm.enable();

          this.alertColor = 'red';
          this.alertMessage =
            'Sorry, an unexpected error occured while uploading your clip. Please try again later.';
          this.inSubmission = false;
          this.showProgressPercent = false;
          console.error(error);
        },
      });
  }
}
