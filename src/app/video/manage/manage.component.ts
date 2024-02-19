import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ClipService } from '../../services/clip.service';
import Clip from '../../models/clip.model';
import { ModalService } from '../../services/modal.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.css',
})
export class ManageComponent implements OnInit {
  sortOrder = '1';
  clips: Clip[] = [];
  activeClip: Clip | null = null;
  sort$: BehaviorSubject<string>;

  constructor(
    private router: Router,
    private currentRoute: ActivatedRoute,
    public clipService: ClipService,
    private modal: ModalService
  ) {
    this.sort$ = new BehaviorSubject(this.sortOrder);
  }

  ngOnInit(): void {
    this.currentRoute.queryParamMap.subscribe((params: Params) => {
      const p = params['params'];
      this.sortOrder = p['sort'] == '2' ? p['sort'] : '1';
      this.sort$.next(this.sortOrder);
    });

    this.clipService.getUserClips(this.sort$).subscribe((docs) => {
      this.clips = [];

      docs.forEach((doc) => {
        this.clips.push({
          ...doc.data(),
          documentId: doc.id,
        });
      });
    });
  }

  sort(event: Event) {
    const { value } = event.target as HTMLSelectElement;
    this.router.navigate([], {
      relativeTo: this.currentRoute,
      queryParams: {
        sort: value,
      },
    });
  }

  openModal(event: Event, clip: Clip) {
    event.preventDefault();
    this.activeClip = clip;
    this.modal.toggleModal('editClip');
  }

  update(event: Clip) {
    this.clips.forEach((clip, index) => {
      if (clip.documentId == event.documentId) {
        this.clips[index].title = event.title;
      }
    });
  }

  deleteClip(event: Event, clip: Clip) {
    event.preventDefault();

    this.clipService.deleteClip(clip);

    this.clips.forEach((item, index) => {
      if (item.documentId === clip.documentId) {
        this.clips.splice(index, 1);
      }
    });
  }

  async copyToClipboard(event: MouseEvent, clipId: string | undefined) {
    event.preventDefault();

    if (!clipId) return;

    const url = `${location.origin}/clips/${clipId}`;

    await navigator.clipboard.writeText(url);

    alert('link copied!');
  }
}
