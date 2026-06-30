export const CLIENT_CONTACTS_LIST_PATH = (clientId: number) =>
  `/api/catalogue/client/${clientId}/contacts/`;

export const CLIENT_CONTACT_CREATE_PATH = '/api/catalogue/client/contact/create/';

export const CLIENT_CONTACT_DETAIL_PATH = (contactId: number) =>
  `/api/catalogue/client/contact/update/${contactId}/`;

export const CLIENT_CONTACT_UPDATE_PATH = (contactId: number) =>
  `/api/catalogue/client/contact/update/${contactId}/`;

export const CLIENT_CONTACT_DELETE_PATH = (contactId: number) =>
  `/api/catalogue/client/contact/delete/${contactId}/`;

export const CLIENT_CSF_UPDATE_PATH = (clientId: number) =>
  `/api/catalogue/client/${clientId}/csf/`;

export const CLIENT_CSF_STORAGE_PREFIX = 'catalog/clients';
