import { joinURL, withQuery } from 'ufo';
import { accessMyBalance } from '~~/shared/abilities';
import { buildOperativeBalanceQuery } from '~~/shared/utils/payment-balance-query';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const token = session?.token;
  const apiUrl = useRuntimeConfig().apiUrl;

  await authorize(event, accessMyBalance);

  const built = buildOperativeBalanceQuery(getQuery(event), {
    dev: import.meta.dev,
  });

  if (built == null) {
    throw createError({
      statusCode: 400,
      message: 'Indica el operador',
    });
  }

  const target = withQuery(
    joinURL(apiUrl, '/api/payment/balance/operative/'),
    built,
  );

  return proxyRequest(event, target, {
    headers: {
      Authorization: `Token ${token}`,
      'Accept-Language': 'es',
    },
  });
});
