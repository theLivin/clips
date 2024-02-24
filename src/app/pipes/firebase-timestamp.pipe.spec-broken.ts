import { FirebaseTimestampPipe } from './firebase-timestamp.pipe';

describe('FirebaseTimestampPipe', () => {
  it('create an instance', () => {
    const pipe = new FirebaseTimestampPipe();
    expect(pipe).toBeTruthy();
  });
});
