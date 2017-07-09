import * as actions from './actions';

const initialState = {
  doc: null,
  sources: null,
  entries: null,
  biblio: null,
  sourceList: null,
  motifList: null,
  isFetching: false
};

export default function appReducer(state = initialState, action) {
  switch (action.type) {
    case actions.FETCH_DOC: {
      return {
        ...state,
        doc: action.motifs,
        sources: action.sources,
        entries: action.entries,
        biblio: action.biblio,
        sourceList: action.sourceList,
        motifList: action.motifList
      };
    }

    default: {
      return state;
    }
  }
}
