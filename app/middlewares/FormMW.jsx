import { v4 as uuidv4 } from 'uuid';

// Actions Verbs
import * as ACTION_TYPES from '../constants/actions.jsx';

// Actions
import * as FormActions from '../actions/form';
import * as InvoicesActions from '../actions/invoices';
import * as ContactsActions from '../actions/contacts';
import * as SettingsActions from '../actions/settings';
import * as UIActions from '../actions/ui';


// Helper
import { getInvoiceData, validateFormData } from '../helpers/form';

// Node Libs
import i18n from '../../i18n/i18n';
const { require: RemoteRequire } = require('@electron/remote')
const appConfig = RemoteRequire('electron-settings');

const FormMW = ({ dispatch, getState }) => next => action => {
  switch (action.type) {
    case ACTION_TYPES.FORM_SAVE: {
      const currentFormData = getState().form;
      const secretKey = getState().login.secretKey;

      // Validate Form Data
      if (!validateFormData(currentFormData)) return;
      const { currentInvoiceData, recipient } = getInvoiceData(currentFormData, secretKey);
      // UPDATE DOC
      if (currentFormData.settings.editMode.active) {
        // Update existing invoice
        dispatch(InvoicesActions.updateInvoice(currentInvoiceData));
        // Change Tab to invoices
        dispatch(UIActions.changeActiveTab('invoices'));
      } else {
        // CREATE DOC
        dispatch(InvoicesActions.saveInvoice(currentInvoiceData));
      }
      // Save Contact to DB if it's a new one
      if (currentFormData.recipient.newRecipient) {
        const newContactData = recipient;
        dispatch(ContactsActions.saveContact(newContactData));
      }
      // Clear The Form
      dispatch(FormActions.clearForm(null, true));
      break;
    }

    case ACTION_TYPES.FORM_ITEM_ADD: {
      return next(
        { ...action, payload: { id: uuidv4() }, }
      );
    }

    case ACTION_TYPES.FORM_CLEAR: {
      // Close Setting Panel
      dispatch(FormActions.closeFormSettings());
      // Clear The Form
      next(action);
      // Create An item
      dispatch(FormActions.addItem());
      break;
    }

    case ACTION_TYPES.SAVED_FORM_SETTING_UPDATE: {
      // Save setting to DB
      const { setting, data } = action.payload;
      appConfig.setSync(`invoice.${setting}`, data);
      // Dispatch notification
      dispatch({
        type: ACTION_TYPES.UI_NOTIFICATION_NEW,
        payload: {
          type: 'success',
          message: i18n.t('messages:settings:saved'),
        },
      });
      // Pass new data to action and continue
      next({
        type: ACTION_TYPES.SAVED_FORM_SETTING_UPDATE,
        payload: appConfig.getSync('invoice'),
      });
      // Reload app settings so that
      // Settings tab will have up-to-date information
      dispatch(SettingsActions.getInitialSettings());
      break;
    }

    default: {
      return next(action);
    }
  }
};

export default FormMW;
