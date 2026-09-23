(function () {
  const { codeBlock, calloutTip, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['avanzado-testing-firebase-sentry'] = {
    id: 'avanzado-testing-firebase-sentry',
    title: 'Avanzado: Testing, Firebase, Sentry',
    icon: '🧪',
    estimatedMinutes: 12,
    sections: [
      {
        heading: 'Vitest: pruebas unitarias',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>pytest</code> o <code>TestCase</code> de Django, con <code>assertEqual</code>.</p>',
            vue: '<p><strong>Vitest</strong>, con <code>describe</code>/<code>it</code>/<code>expect</code> — la sintaxis es casi calcada a <code>pytest</code> con clases de test, o a Jest si vienes de ahí.</p>',
          })}
          <p>Test real y completo de este repo (<code>test/unit/rescue-administrative-doc-numbers.test.ts</code>):</p>
          ${codeBlock('ts', `
import { describe, expect, it } from 'vitest';
import { generateInvoiceNumber, generateRemittanceNumber } from '~/utils/rescue-administrative-doc-numbers';

describe('rescue-administrative-doc-numbers', () => {
  it('generates remittance number with year', () => {
    const value = generateRemittanceNumber(new Date('2026-06-02'));
    expect(value).toMatch(/^REM-2026-\\d{5}$/);
  });

  it('generates invoice number prefix', () => {
    const value = generateInvoiceNumber();
    expect(value).toMatch(/^A-\\d{6}$/);
  });
});
          `)}
          <p>
            El proyecto separa dos "modos" de test: <code>test:unit</code> (funciones puras, sin
            Nuxt, rápidas) y <code>test:nuxt</code> (componentes que sí necesitan el entorno de
            Nuxt montado). <code>vitest.config.ts</code> define ambos como "proyectos" separados.
          </p>
        `,
      },
      {
        heading: 'Playwright: pruebas end-to-end',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>LiveServerTestCase</code> + Selenium, si alguna vez lo usaste para probar flujos completos en el navegador.</p>',
            vue: '<p><strong>Playwright</strong>: abre un navegador de verdad (headless), navega, hace click, llena formularios, y verifica lo que ve — pruebas de flujo completo, no solo de una función aislada.</p>',
          })}
          <p>En este repo corren specs de responsividad: <code>pnpm test:e2e</code> usa <code>test/e2e/responsive/playwright.config.ts</code>.</p>
        `,
      },
      {
        heading: 'Firebase + VueFire',
        bodyHtml: `
          <p>
            No todo pasa por el proxy a Django del módulo 10. El chat en tiempo real y las
            evidencias (fotos/archivos subidos) usan <strong>Firebase</strong> (Realtime Database y
            Storage) directamente, con <strong>VueFire</strong> como la capa que integra Firebase
            con la reactividad de Vue (los datos de Firebase se comportan como <code>ref</code>s que
            se actualizan solos cuando algo cambia en la base de datos, sin hacer polling).
          </p>
        `,
      },
      {
        heading: 'Sentry: observabilidad de errores',
        bodyHtml: `
          <p>
            Sentry captura errores tanto del cliente (JS roto en el navegador de un usuario real)
            como del servidor (<code>server/</code>). Recordando el módulo 10: cuando el proxy recibe
            un <code>401</code>/<code>403</code>/<code>500</code> de Django, también reporta ese
            evento a Sentry — así el equipo se entera de fallas de Django sin depender de que un
            usuario reporte el bug manualmente.
          </p>
        `,
      },
      {
        heading: 'ESLint sin Prettier',
        bodyHtml: `
          <p>
            El repo usa <code>@nuxt/eslint</code> con configuración plana (<code>eslint.config.mjs</code>),
            que ya trae reglas de formato integradas (comillas, indentación, etc.) — por eso no hay
            un <code>.prettierrc</code> separado. <code>pnpm lint:fix</code> corrige lo que puede
            automáticamente.
          </p>
        `,
      },
    ],
    playground: {
      starterCode: `
// Mini test-runner casero: misma idea que Vitest (describe/it/expect),
// para "escribir y correr un test" sin instalar nada.
const resultados = [];

function describe(nombre, fn) {
  resultados.push({ tipo: 'grupo', nombre });
  fn();
}

function it(nombre, fn) {
  try {
    fn();
    resultados.push({ tipo: 'test', nombre, ok: true });
  } catch (e) {
    resultados.push({ tipo: 'test', nombre, ok: false, error: e.message });
  }
}

function expect(valor) {
  return {
    toBe(esperado) {
      if (valor !== esperado) {
        throw new Error(\`esperaba \${JSON.stringify(esperado)} pero recibió \${JSON.stringify(valor)}\`);
      }
    },
    toMatch(regex) {
      if (!regex.test(valor)) {
        throw new Error(\`"\${valor}" no coincide con \${regex}\`);
      }
    },
  };
}

// función real (simplificada) que estamos probando:
function generateRemittanceNumber(fecha) {
  const year = fecha.getFullYear();
  return \`REM-\${year}-00001\`;
}

describe('rescue-administrative-doc-numbers', () => {
  it('genera un número de remisión con el año correcto', () => {
    const valor = generateRemittanceNumber(new Date('2026-06-02'));
    expect(valor).toMatch(/^REM-2026-\\d{5}$/);
  });
});

// Muestra el resultado en el panel
mountEl.innerHTML = resultados
  .map((r) => r.tipo === 'grupo'
    ? \`<p><strong>\${r.nombre}</strong></p>\`
    : \`<p style="margin-left:12px;">\${r.ok ? '✓' : '✗'} \${r.nombre}\${r.error ? ' — ' + r.error : ''}</p>\`)
  .join('');

// Reto: agrega un segundo it(...) que pruebe un caso que FALLE a propósito
// (ej. comparar contra el año equivocado) y observa cómo se ve un test roto
`,
      solutionCode: `
const resultados = [];

function describe(nombre, fn) {
  resultados.push({ tipo: 'grupo', nombre });
  fn();
}

function it(nombre, fn) {
  try {
    fn();
    resultados.push({ tipo: 'test', nombre, ok: true });
  } catch (e) {
    resultados.push({ tipo: 'test', nombre, ok: false, error: e.message });
  }
}

function expect(valor) {
  return {
    toBe(esperado) {
      if (valor !== esperado) {
        throw new Error(\`esperaba \${JSON.stringify(esperado)} pero recibió \${JSON.stringify(valor)}\`);
      }
    },
    toMatch(regex) {
      if (!regex.test(valor)) {
        throw new Error(\`"\${valor}" no coincide con \${regex}\`);
      }
    },
  };
}

function generateRemittanceNumber(fecha) {
  const year = fecha.getFullYear();
  return \`REM-\${year}-00001\`;
}

describe('rescue-administrative-doc-numbers', () => {
  it('genera un número de remisión con el año correcto', () => {
    const valor = generateRemittanceNumber(new Date('2026-06-02'));
    expect(valor).toMatch(/^REM-2026-\\d{5}$/);
  });

  it('falla a propósito comparando contra el año equivocado', () => {
    const valor = generateRemittanceNumber(new Date('2026-06-02'));
    expect(valor).toMatch(/^REM-2099-\\d{5}$/);
  });
});

mountEl.innerHTML = resultados
  .map((r) => r.tipo === 'grupo'
    ? \`<p><strong>\${r.nombre}</strong></p>\`
    : \`<p style="margin-left:12px;">\${r.ok ? '✓' : '✗'} \${r.nombre}\${r.error ? ' — ' + r.error : ''}</p>\`)
  .join('');
`,
    },
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: '¿Qué diferencia hay entre el proyecto "unit" y el proyecto "nuxt" de Vitest en este repo?',
          options: [
            'No hay ninguna diferencia real',
            '"unit" solo prueba archivos .vue',
            '"nuxt" es para producción y "unit" para desarrollo',
            '"unit" prueba funciones puras sin Nuxt (rápido); "nuxt" prueba componentes que necesitan el entorno de Nuxt montado',
          ],
          correctIndex: 3,
          explanation: 'Separar ambos "proyectos" en vitest.config.ts permite correr las pruebas rápidas de funciones puras sin pagar el costo de montar el entorno completo de Nuxt.',
        },
        {
          question: '¿Para qué se usa Firebase/VueFire en este proyecto, a diferencia del proxy a Django?',
          options: [
            'Para reemplazar completamente a Django',
            'Para hacer el build de producción',
            'Para funcionalidad en tiempo real (chat, evidencias) que no pasa por el proxy BFF a Django',
            'Para el sistema de rutas',
          ],
          correctIndex: 2,
          explanation: 'Firebase/VueFire maneja datos en tiempo real (chat, archivos de evidencia) de forma independiente al proxy que habla con Django.',
        },
        {
          question: '¿Qué gana el equipo al reportar a Sentry los errores 401/403/500 que devuelve Django a través del proxy?',
          options: [
            'Nada, es solo un log más',
            'Se enteran de fallas del backend real sin depender de que un usuario reporte el bug manualmente',
            'Hace que Django responda más rápido',
            'Reemplaza la necesidad de hacer testing',
          ],
          correctIndex: 1,
          explanation: 'Sentry da visibilidad proactiva de errores de backend (vistos a través del proxy) que de otra forma solo se descubrirían por reporte manual de un usuario.',
        },
      ],
    },
  };
})();
