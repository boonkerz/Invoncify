import { isEmpty, pick, includes } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import i18n from '../../i18n/i18n';
import { getInvoiceValue } from './invoice';
import { encrypt } from './encryption';
const appConfig = require('@electron/remote').require('electron-settings');
const openDialog = require('../renderers/dialog');

function validateFormData(formData) {
  const {
    invoiceID,
    recipient,
    rows,
    dueDate,
    currency,
    discount,
    tax,
    note,
    payment,
    settings,
  } = formData;
  // Required fields
  const { required_fields } = settings;
  if (!validateInvoiceID(required_fields.invoiceID, invoiceID)) return false;
  if (!validateRecipient(recipient)) return false;
  if (!validateRows(rows)) return false;
  if (!validateDueDate(required_fields.dueDate, dueDate)) return false;
  if (!validateCurrency(required_fields.currency, currency)) return false;
  if (!validateDiscount(required_fields.discount, discount)) return false;
  if (!validateTax(required_fields.tax, tax)) return false;
  if (!validateNote(required_fields.note, note)) return false;
  if (!validatePayment(required_fields.payment, payment)) return false;
  return true;
}

function getInvoiceData(formData, secretKey) {
  const {
    invoiceID,
    recipient,
    rows,
    dueDate,
    currency,
    discount,
    tax,
    note,
    payment,
    settings,
    created_at,
  } = formData;
  // Required fields
  const { editMode, required_fields } = settings;
  // Set Initial Value
  const invoiceData = { rows };
  // Set Recipient
  if (recipient.newRecipient) {
    // Add id & created_at so the invoice records will remembers
    invoiceData.recipient = {
      ...recipient.new,
      _id: uuidv4(),
      created_at: Date.now(),
    };
  } else {
    // TODO
    // Migh as well filter out _rev
    invoiceData.recipient = recipient.select;
  }
  // Set InvoiceID
  if (required_fields.invoiceID) invoiceData.invoiceID = invoiceID;
  // Set DueDate
  if (required_fields.dueDate) invoiceData.dueDate = dueDate;
  // Set Currency
  if (required_fields.currency) {
    invoiceData.currency = currency;
  } else {
    invoiceData.currency = appConfig.getSync('invoice.currency');
  }
  // Set Discount
  if (required_fields.discount) invoiceData.discount = discount;
  // Set Tax
  if (required_fields.tax) invoiceData.tax = tax;
  // Set Note
  if (required_fields.note) invoiceData.note = note.content;
  // Set Payment
  if (required_fields.payment) invoiceData.payment = payment;

  // Return final value

  const invoice = {
    _id: editMode.active ? editMode.data._id : uuidv4(),
    _rev: editMode.active ? editMode.data._rev : null,
  };

  let createdAtToUpdate = Date.now();

  if (editMode.active) {
    createdAtToUpdate =
      created_at.created_at !== editMode.data.created_at
        ? created_at.created_at
        : editMode.data.created_at;
  }

  const content = encrypt({
    docs: {
      ...invoiceData, // Metadata
      created_at: createdAtToUpdate,
      updated_at: Date.now(),
      status: editMode.active ? editMode.data.status : 'pending',
      // Alway calculate subtotal & grandTotal
      subtotal: getInvoiceValue(invoiceData).subtotal,
      grandTotal: getInvoiceValue(invoiceData).grandTotal,
    },
    secretKey,
  });

  invoice.content = content;

  const newRecipient = {
    _id: invoiceData.recipient._id,
  };

  delete invoiceData.recipient._id;

  const recipientContent = encrypt({
    docs: {
      ...invoiceData.recipient,
    },
    secretKey,
  });

  newRecipient.content = recipientContent;

  return {
    currentInvoiceData: invoice,
    recipient: newRecipient,
  };
}

// VALIDATION RULES
function validateRecipient(recipient) {
  if (recipient.newRecipient === true) {
    // Is Recipient Form Data Empty?
    if (isEmpty(recipient.new)) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:recipient:empty:title'),
        message: i18n.t('dialog:validation:recipient:empty:message'),
      });
      return false;
    }
    // Are required fields empty?
    if (
      recipient.new.fullname === undefined ||
      recipient.new.fullname === '' ||
      recipient.new.email === undefined ||
      recipient.new.email === ''
    ) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:recipient:requiredFields:title'),
        message: i18n.t('dialog:validation:recipient:requiredFields:message'),
      });
      return false;
    }
    // Is email address valid?
    const regex =
      /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!regex.test(recipient.new.email)) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:recipient:email:title'),
        message: i18n.t('dialog:validation:recipient:email:message'),
      });
      return false;
    }
  }
  // Passed
  return true;
}

function validateRows(rows) {
  let validated = true;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Does it contain description?
    if (!row.description) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:rows:emptyDescription:title'),
        message: i18n.t('dialog:validation:rows:emptyDescription:message'),
      });
      validated = false;
      break;
    }
    // Is the price presented and greater than 0?
    if (!row.price || row.price <= 0) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:rows:priceZero:title'),
        message: i18n.t('dialog:validation:rows:priceZero:message'),
      });
      validated = false;
      break;
    }
    // Is the quantity presented and greater than 0?
    if (!row.quantity || row.quantity <= 0) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:rows:qtyZero:title'),
        message: i18n.t('dialog:validation:rows:qtyZero:message'),
      });
      validated = false;
      break;
    }
  }
  return validated;
}

function validateDueDate(isRequired, dueDate) {
  const { selectedDate, paymentTerm, useCustom } = dueDate;
  if (isRequired) {
    // If use customDate
    if (useCustom) {
      if (!selectedDate || selectedDate === null) {
        openDialog({
          type: 'warning',
          title: i18n.t('dialog:validation:dueDate:title'),
          message: i18n.t('dialog:validation:dueDate:message'),
        });
        return false;
      }
      return true;
    }
    return true;
  }
  return true;
}

function validateCurrency(isRequired, currency) {
  if (isRequired) {
    if (currency.fraction < 0) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:currency:fraction:title'),
        message: i18n.t('dialog:validation:currency:fraction:message'),
      });
      return false;
    }
    return true;
  }
  return true;
}

function validateDiscount(isRequired, discount) {
  const { amount } = discount;
  if (isRequired) {
    if (!amount || amount === '' || amount === 0) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:discount:title'),
        message: i18n.t('dialog:validation:discount:message'),
      });
      return false;
    }
    return true;
  }
  return true;
}

function validateTax(isRequired, tax) {
  const { amount } = tax;
  if (isRequired) {
    if ([null, undefined, ''].includes(amount) || amount < 0) {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:tax:title'),
        message: i18n.t('dialog:validation:tax:message'),
      });
      return false;
    }
    return true;
  }
  return true;
}

function validateNote(isRequired, note) {
  const { content } = note;
  if (isRequired) {
    if (!content || content === '') {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:note:title'),
        message: i18n.t('dialog:validation:note:message'),
      });
      return false;
    }
    return true;
  }
  return true;
}

function validatePayment(isRequired, payment) {
  const { details } = payment;
  if (isRequired) {
    if (!details || details === '') {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:payment:title'),
        message: i18n.t('dialog:validation:payment:message'),
      });
      return false;
    }
    return true;
  }
  return true;
}

function validateInvoiceID(isRequired, invoiceID) {
  if (isRequired) {
    if (!invoiceID || invoiceID === '') {
      openDialog({
        type: 'warning',
        title: i18n.t('dialog:validation:invoiceID:title'),
        message: i18n.t('dialog:validation:invoiceID:message'),
      });
      return false;
    }
    return true;
  }
  return true;
}

// SET RECIPIENT INFORMATION IN EDIT MODE
function setEditRecipient(allContacts, currentContact) {
  if (allContacts.length) {
    const contactIDs = allContacts.map((contact) => contact._id);
    if (includes(contactIDs, currentContact._id)) {
      return {
        newRecipient: false,
        select: currentContact,
      };
    }
  }
  return {
    newRecipient: true,
    new: pick(currentContact, [
      'fullname',
      'company',
      'phone',
      'email',
      'address',
    ]),
  };
}

export {
  getInvoiceData,
  validateFormData,
  validateRecipient,
  validateRows,
  validateDueDate,
  validateCurrency,
  validateDiscount,
  validateTax,
  validateNote,
  validatePayment,
  setEditRecipient,
};
