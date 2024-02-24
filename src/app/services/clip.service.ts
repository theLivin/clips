import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
  QuerySnapshot,
} from '@angular/fire/compat/firestore';
import Clip from '../models/clip.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of, combineLatest, lastValueFrom } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  ResolveFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ClipService {
  private clipsCollection: AngularFirestoreCollection<Clip>;
  pageClips: Clip[] = [];
  requestInProgress = false;
  PAGE_SIZE = 8;

  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router: Router
  ) {
    this.clipsCollection = this.db.collection('clips');
  }

  getClipLink(clipId?: string): string[] {
    return ['/', 'clips', clipId as string];
  }

  createClip(data: Clip): Promise<DocumentReference<Clip>> {
    return this.clipsCollection.add(data);
  }

  getUserClips(sort$: BehaviorSubject<string>) {
    return combineLatest([this.auth.user, sort$]).pipe(
      switchMap((values) => {
        const [user, sort] = values;

        if (!user) {
          return of({});
        }

        const query = this.clipsCollection.ref
          .where('uid', '==', user.uid)
          .orderBy('timestamp', sort === '1' ? 'desc' : 'asc');

        return query.get();
      }),
      map((snapshot) => (snapshot as QuerySnapshot<Clip>).docs)
    );
  }

  updateClip(clipId: string, title: string) {
    return this.clipsCollection.doc(clipId).update({ title });
  }

  async deleteClip(clip: Clip) {
    const clipRef = this.storage.ref(`clips/${clip.fileName}`);
    const screenshotRef = this.storage.ref(
      `screenshots/${clip.screenshotFileName}`
    );

    await clipRef.delete();
    await screenshotRef.delete();
    await this.clipsCollection.doc(clip.documentId).delete();
  }

  async getClips() {
    if (this.requestInProgress) return;
    this.requestInProgress = true;

    let query = this.clipsCollection.ref
      .orderBy('timestamp', 'desc')
      .limit(this.PAGE_SIZE);

    const { length } = this.pageClips;
    if (length) {
      const lastDocumentId = this.pageClips[length - 1].documentId;
      const lastDocument = await lastValueFrom(
        this.clipsCollection.doc(lastDocumentId).get()
      );

      query = query.startAfter(lastDocument);
    }

    const snapshot = await query.get();
    snapshot.forEach((doc) => {
      this.pageClips.push({
        ...doc.data(),
        documentId: doc.id,
      });
    });

    this.requestInProgress = false;
  }

  resolve: ResolveFn<Clip | null> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    return this.clipsCollection
      .doc(route.params['id'])
      .get()
      .pipe(
        map((snapshot) => {
          const data = snapshot.data();

          if (!data) {
            this.router.navigate(['/', 'not-found']);
            return null;
          }

          return data;
        })
      );
  };
}
