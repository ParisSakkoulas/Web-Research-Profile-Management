import { ExternalReference } from "src/app/models/externalReference.model";

export interface ReferenceState {
  references: ExternalReference[];
  error: string | null;
  status: 'pending' | 'loading' | 'error' | 'success';
}

export const initialState: ReferenceState = {
  references: [],
  error: null,
  status: 'pending'
}
