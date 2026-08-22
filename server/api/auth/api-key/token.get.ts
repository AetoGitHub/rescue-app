import { fetchDjangoApiKeyToken } from '../../../utils/fill-oc-staff-auth';

export default defineEventHandler(async (event) => {
  return await fetchDjangoApiKeyToken(event);
});
