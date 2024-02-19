import firebase from 'firebase/compat/app';

export default interface Clip {
  documentId?: string;
  uid: string;
  displayName: string;
  title: string;
  fileName: string;
  url: string;
  timestamp: firebase.firestore.FieldValue;
  screenshotUrl: string;
  screenshotFileName: string;
}
