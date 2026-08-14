import { fetchFillOc } from '../../utils/nexxt-step-api';

export default defineEventHandler(async (event) => {
  return await fetchFillOc(event, { method: 'GET' });
});
