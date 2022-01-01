import { createAction } from 'redux-actions';
import * as ACTION_TYPES from '../constants/actions.jsx';

// Get All Contacts
export const exportData = createAction(ACTION_TYPES.EXPORT_DATA);
export const importData = createAction(ACTION_TYPES.IMPORT_DATA);