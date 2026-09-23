(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['js-moderno'] = {
    id: 'js-moderno',
    title: 'JS moderno esencial',
    icon: '⚡',
    estimatedMinutes: 14,
    sections: [
      {
        heading: 'let / const en vez de var',
        bodyHtml: `
          <p><code>let</code> y <code>const</code> tienen alcance de bloque (como las variables de Python dentro de una función). <code>var</code> casi no se usa en código moderno — no lo vas a ver en este repo.</p>
          ${codeBlock('js', `
const total = 10;      // no se puede reasignar (como una constante)
let contador = 0;      // sí se puede reasignar
contador += 1;

// total = 20;         // Error: Assignment to constant variable.
          `)}
          ${calloutTip('Regla práctica de este repo: usa <code>const</code> por defecto, y <code>let</code> solo si de verdad vas a reasignar la variable.')}
        `,
      },
      {
        heading: 'Arrow functions',
        bodyHtml: `
          <p>Una forma más corta de escribir funciones, muy usada dentro de <code>computed()</code>, <code>.map()</code>, <code>.filter()</code>, callbacks, etc.</p>
          ${codeBlock('js', `
// función tradicional
function duplicar(n) {
  return n * 2;
}

// arrow function equivalente
const duplicar2 = (n) => n * 2;

// con cuerpo de bloque (necesitas "return" explícito)
const describir = (rescue) => {
  const activo = rescue.status !== 'cancelled';
  return activo ? 'Activo' : 'Cancelado';
};

[1, 2, 3].map((n) => n * 2); // [2, 4, 6]
          `)}
          ${calloutTip('A diferencia de una función tradicional, una arrow function no crea su propio <code>this</code> — toma el <code>this</code> de donde fue definida. En código con Composition API casi no vas a notar la diferencia porque casi no se usa <code>this</code>.')}
        `,
      },
      {
        heading: 'Destructuring: sacar valores de objetos y arrays',
        bodyHtml: `
          <p>El equivalente a desempacar una tupla en Python (<code>a, b = (1, 2)</code>), pero para objetos y arrays.</p>
          ${codeBlock('js', `
const rescue = { id: 42, status: 'in_progress', client: { name: 'Ana' } };

// objeto: extrae por nombre de propiedad (puedes renombrar y anidar)
const { id, status, client: { name } } = rescue;

// esto es EXACTAMENTE lo mismo que hace Vue con las props:
// defineProps<{ compact?: boolean }>()  ->  luego usas "compact" directo

// array: extrae por posición
const [primero, segundo] = [10, 20];

// muy común en composables de este repo:
const { data, isLoading, error } = useRescueChatMessages(rescueId);
          `)}
        `,
      },
      {
        heading: 'Template literals',
        bodyHtml: `
          <p>El equivalente a los f-strings de Python (<code>f"Hola {nombre}"</code>), pero con backticks y <code>\${...}</code>.</p>
          ${codeBlock('js', `
const nombre = 'Ana';
const saludo = \`Hola \${nombre}, tienes \${3 + 2} rescates pendientes\`;

// también sirven para strings multilínea, sin necesitar "\\n"
const mensaje = \`Línea uno
Línea dos\`;
          `)}
        `,
      },
      {
        heading: 'Spread y rest (...)',
        bodyHtml: `
          <p>El mismo símbolo <code>...</code> hace dos cosas distintas según el contexto — como <code>*args</code>/<code>**kwargs</code> en Python, pero también sirve para "expandir" datos.</p>
          ${codeBlock('js', `
// spread: expande un objeto/array dentro de otro (copia inmutable)
const base = { compact: false, showExpiredHint: true };
const props = { ...base, compact: true }; // sobreescribe compact

const numeros = [1, 2, 3];
const masNumeros = [...numeros, 4, 5]; // [1, 2, 3, 4, 5]

// rest: agrupa el resto de argumentos/propiedades
function sumar(...valores) {
  return valores.reduce((acc, v) => acc + v, 0);
}
sumar(1, 2, 3); // 6

const { id, ...resto } = rescue; // resto = todo menos "id"
          `)}
        `,
      },
      {
        heading: 'async/await y Promises',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>Una vista normal de Django es <strong>síncrona</strong>: el código corre línea por línea y bloquea hasta terminar (salvo que uses <code>asyncio</code>/<code>async def</code> explícitamente).</p>',
            vue: '<p>Casi todo lo que toca red en este proyecto es <strong>asíncrono por defecto</strong>: cada <code>fetch</code>, cada query de Pinia Colada, cada composable que trae datos, usa <code>async/await</code> o devuelve una Promise.</p>',
          })}
          ${codeBlock('js', `
async function cargarRescate(id) {
  const respuesta = await fetch(\`/api/rescue/\${id}\`);
  const datos = await respuesta.json();
  return datos;
}

// "await" solo funciona dentro de una función "async"
// una Promise sin resolver se ve como: Promise { <pending> }
          `)}
          ${calloutWarning('Si olvidas el <code>await</code>, obtienes la Promise en sí (un objeto "en progreso"), no el valor final. Es el error más común al empezar con JS async.')}
        `,
      },
      {
        heading: 'import / export de módulos',
        bodyHtml: `
          <p>El equivalente a <code>from module import función</code> en Python.</p>
          ${codeBlock('ts', `
// archivo: app/utils/rescue-chat.ts
export function getRescueChatMessageVariant(message, currentUserId) {
  /* ... */
}

// en otro archivo:
import { getRescueChatMessageVariant } from '~/utils/rescue-chat';
          `)}
          ${calloutTip('En este repo, la mayoría de composables y utils ni siquiera necesitan el <code>import</code> explícito: Nuxt los <strong>auto-importa</strong> por convención. Lo vemos en el módulo 6.')}
        `,
      },
      {
        heading: 'Optional chaining (?.) y nullish coalescing (??)',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>getattr(obj, "nombre", None)</code> para acceder de forma segura a un atributo que podría no existir.</p>',
            vue: '<p><code>obj?.nombre</code> hace lo mismo: si <code>obj</code> es <code>null</code>/<code>undefined</code>, la expresión completa da <code>undefined</code> en vez de lanzar un error.</p>',
          })}
          ${codeBlock('js', `
const mensaje = { created_by_name: null };

mensaje.created_by_name?.trim();      // undefined, no lanza error
mensaje.created_by_name?.trim() || 'Usuario'; // con || también funciona, pero...

// ?? solo cae al valor por defecto si es null/undefined
// (a diferencia de ||, que también cae con 0, '', false)
const intentos = 0;
intentos || 5;   // 5  (0 es "falsy", probablemente no es lo que quieres)
intentos ?? 5;   // 0  (0 no es null/undefined, se respeta)
          `)}
          ${calloutTip('Ejemplo real del repo (<code>rescue-chat.ts</code>): <code>const name = message.created_by_name?.trim(); return name || "Usuario";</code>')}
        `,
      },
    ],
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: '¿Cuál es la principal diferencia entre let y const?',
          options: [
            'let es más rápido que const',
            'No hay ninguna diferencia real',
            'const solo funciona con números',
            'const no permite reasignar la variable; let sí',
          ],
          correctIndex: 3,
          explanation: 'const declara una variable cuyo valor (la referencia) no puede reasignarse. let sí permite reasignación. Ambos tienen alcance de bloque, a diferencia de var.',
        },
        {
          question: 'Dado const { id, name } = rescue;, ¿qué está pasando?',
          options: [
            'Se extraen las propiedades id y name del objeto rescue en variables sueltas',
            'Se crea un nuevo objeto llamado id con la propiedad name',
            'Es una forma de definir una arrow function',
            'Es equivalente a rescue.id = rescue.name',
          ],
          correctIndex: 0,
          explanation: 'Es destructuring de objeto: crea variables id y name tomando los valores de las propiedades homónimas de rescue.',
        },
        {
          question: '¿Qué devuelve la expresión 0 ?? 5?',
          options: ['5', 'undefined', '0', 'Error'],
          correctIndex: 2,
          explanation: '?? solo usa el valor por defecto cuando el valor de la izquierda es null o undefined. 0 no lo es, así que el resultado es 0 (a diferencia de || que sí caería a 5).',
        },
        {
          question: 'Si mensaje.created_by_name es null, ¿qué devuelve mensaje.created_by_name?.trim()?',
          options: [
            'undefined, sin lanzar error',
            'Lanza un error porque null no tiene el método trim()',
            'Un string vacío',
            'null convertido a string',
          ],
          correctIndex: 0,
          explanation: 'El operador ?. corta la cadena y devuelve undefined en vez de intentar llamar .trim() sobre null, evitando el error "Cannot read property of null".',
        },
        {
          question: '¿Qué palabra clave necesitas para poder usar await dentro de una función?',
          options: ['sync', 'promise', 'async', 'defer'],
          correctIndex: 2,
          explanation: 'await solo es válido dentro de una función declarada como async (o en el nivel superior de un módulo en algunos entornos).',
        },
      ],
    },
    playground: {
      starterCode: `
// mountEl es un <div> donde puedes escribir resultados.
function log(...valores) {
  const linea = document.createElement('div');
  linea.textContent = valores.map((v) => JSON.stringify(v)).join(' ');
  mountEl.appendChild(linea);
}

// 1) Destructuring: extrae "id" y el "name" anidado dentro de "client"
const rescue = { id: 42, status: 'in_progress', client: { name: 'Ana' } };
const { id, client: { name } } = rescue;
log('id:', id, 'cliente:', name);

// 2) Optional chaining + nullish coalescing
const sinFolio = { folio: null };
log('folio:', sinFolio.folio ?? 'sin folio asignado');

// 3) Template literal
log(\`Rescate #\${id} atendido por \${name}\`);

// Reto: agrega una línea que use spread para combinar
// { ...rescue, status: 'completed' } y muestra el resultado con log(...)
`,
      solutionCode: `
function log(...valores) {
  const linea = document.createElement('div');
  linea.textContent = valores.map((v) => JSON.stringify(v)).join(' ');
  mountEl.appendChild(linea);
}

const rescue = { id: 42, status: 'in_progress', client: { name: 'Ana' } };
const { id, client: { name } } = rescue;
log('id:', id, 'cliente:', name);

const sinFolio = { folio: null };
log('folio:', sinFolio.folio ?? 'sin folio asignado');

log(\`Rescate #\${id} atendido por \${name}\`);

// Reto resuelto: spread para crear una copia con un campo cambiado
const actualizado = { ...rescue, status: 'completed' };
log('actualizado:', actualizado);
`,
    },
  };
})();
