import { createStore, combineReducers, applyMiddleware } from 'redux';
import { valuesReducer } from './reducers/valuesReducer.js';

import thunk from 'redux-thunk';

const reducer = combineReducers({
  values: valuesReducer
});

export const store = createStore(reducer, applyMiddleware(thunk));
