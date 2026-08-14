import { fetchFillOc } from '../../utils/nexxt-step-api';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  return await fetchFillOc(event, { method: 'POST', body });
});
