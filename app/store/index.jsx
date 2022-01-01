// Redux
import { createStore, applyMiddleware, compose } from 'redux';

// Root Reducer
import rootReducer from '../reducers';

// 3rd Party MWs
import Logger from 'redux-logger';

// Custom Middleware
import LoginMW from '../middlewares/LoginMW';
import MeasureMW from '../middlewares/MeasureMW';
import FormMW from '../middlewares/FormMW';
import ContactsMW from '../middlewares/ContactsMW';
import InvoicesMW from '../middlewares/InvoicesMW';
import SettingsMW from '../middlewares/SettingsMW';
import UIMiddleware from '../middlewares/UIMiddleware';
import ExportImportMW from '../middlewares/ExportImportMW';

// Default Middlewares
const middlewares = [LoginMW, FormMW, ContactsMW, InvoicesMW, SettingsMW, UIMiddleware, ExportImportMW];

// Dev Mode Middlewares
if (process.env.isDev === 'true') {
  middlewares.unshift(MeasureMW);
  middlewares.push(Logger);
}

// Redux Devtool
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middlewares))
  );
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextReducer = require('../reducers/index').default;
      store.replaceReducer(nextReducer);
    });
  }
  return store;
}
