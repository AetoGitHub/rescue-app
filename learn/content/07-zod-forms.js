(function () {
  const { codeBlock, calloutTip, calloutWarning, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['zod-forms'] = {
    id: 'zod-forms',
    title: 'Zod + formularios (UForm)',
    icon: '✅',
    estimatedMinutes: 11,
    sections: [
      {
        heading: 'Zod: esquemas de validación',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>forms.CharField(min_length=1)</code> o un serializer de DRF con sus <code>validators</code>.</p>',
            vue: '<p>Un esquema de <strong>Zod</strong> (<code>app/schemas/</code>): declaras la forma de los datos y las reglas juntas, y Zod te da tanto la validación como el tipo TypeScript.</p>',
          })}
          <p>Ejemplo real y simplificado de <code>app/schemas/rescue-administrative.ts</code>:</p>
          ${codeBlock('ts', `
import { z } from 'zod';

export const rescueInvoiceSchema = z.object({
  invoice_number: z.string().trim().min(1, 'Ingresa el número de factura'),
  invoice_date: z.string().trim().min(1, 'Ingresa la fecha de factura'),
  invoice_amount: z
    .string()
    .trim()
    .min(1, 'Ingresa el monto')
    .refine((value) => Number(value.replace(/,/g, '')) > 0, {
      message: 'El monto debe ser mayor a 0',
    }),
});
          `)}
        `,
      },
      {
        heading: 'z.infer: el tipo sale gratis',
        bodyHtml: `
          ${codeBlock('ts', `
import { z } from 'zod';

const schema = z.object({ nombre: z.string(), edad: z.number() });

// no escribes la interfaz a mano: TypeScript la infiere del esquema
type Persona = z.infer<typeof schema>;
// equivale a: interface Persona { nombre: string; edad: number }
          `)}
          ${calloutTip('Esto evita el problema clásico de "la validación dice una cosa y el tipo dice otra": hay una sola fuente de verdad, el esquema.')}
        `,
      },
      {
        heading: 'Usado con UForm / UFormField (Nuxt UI)',
        bodyHtml: `
          ${codeBlock('vue', `
<UForm :schema="rescueInvoiceSchema" :state="form" @submit="onSubmit">
  <UFormField label="Número de factura" name="invoice_number">
    <UInput v-model="form.invoice_number" />
  </UFormField>
</UForm>
          `)}
          <p>
            <code>UForm</code> corre el <code>schema</code> de Zod automáticamente al enviar (y opcionalmente
            en cada cambio), y <code>UFormField</code> muestra el mensaje de error debajo del campo
            correspondiente si Zod lo rechaza — sin que tengas que escribir ese cableado a mano.
          </p>
        `,
      },
      {
        heading: 'La validación del cliente no reemplaza la de Django',
        bodyHtml: `
          ${calloutWarning('Zod valida en el navegador para dar feedback inmediato al usuario — pero cualquiera puede saltarse el navegador y mandar una petición directa. Django (a través del proxy del módulo 10) sigue siendo quien valida "de verdad" antes de tocar la base de datos. Son dos capas, no una sola.')}
        `,
      },
    ],
    playground: {
      starterCode: `
// "MiniZod" simula la API real de Zod (z.object, z.string, .min, .email,
// .safeParse) para poder ejecutar el ejemplo aquí sin build. En el proyecto
// real esto es: import { z } from 'zod';
const z = MiniZod;

const rescueContactSchema = z.object({
  name: z.string().min(1, 'Ingresa el nombre'),
  email: z.string().email('Correo inválido'),
});

function validar(datos) {
  const resultado = rescueContactSchema.safeParse(datos);
  if (resultado.success) {
    mountEl.textContent = '✓ Datos válidos: ' + JSON.stringify(resultado.data);
  } else {
    const mensajes = resultado.error.issues.map((i) => i.path.join('.') + ': ' + i.message);
    mountEl.textContent = '✗ Errores: ' + mensajes.join(' | ');
  }
}

// Prueba con datos inválidos:
validar({ name: '', email: 'no-es-un-correo' });

// Reto: cambia los datos de prueba para que pasen la validación
`,
      solutionCode: `
const z = MiniZod;

const rescueContactSchema = z.object({
  name: z.string().min(1, 'Ingresa el nombre'),
  email: z.string().email('Correo inválido'),
});

function validar(datos) {
  const resultado = rescueContactSchema.safeParse(datos);
  if (resultado.success) {
    mountEl.textContent = '✓ Datos válidos: ' + JSON.stringify(resultado.data);
  } else {
    const mensajes = resultado.error.issues.map((i) => i.path.join('.') + ': ' + i.message);
    mountEl.textContent = '✗ Errores: ' + mensajes.join(' | ');
  }
}

validar({ name: 'Ana', email: 'ana@example.com' });
`,
    },
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: '¿Qué ventaja da z.infer<typeof schema> frente a escribir la interfaz TypeScript a mano?',
          options: [
            'Hace que el código corra más rápido',
            'No tiene ninguna ventaja real',
            'Permite usar Zod sin instalarlo',
            'Garantiza que el tipo y la validación nunca se desincronicen, porque salen del mismo esquema',
          ],
          correctIndex: 3,
          explanation: 'Al derivar el tipo del esquema con z.infer, cualquier cambio en las reglas de validación actualiza automáticamente el tipo TypeScript correspondiente.',
        },
        {
          question: '¿Qué hace UFormField cuando UForm recibe un :schema de Zod y el envío falla la validación?',
          options: [
            'Nada, hay que mostrar los errores a mano',
            'Bloquea toda la página',
            'Muestra el mensaje de error de Zod debajo del campo correspondiente automáticamente',
            'Envía el formulario de todas formas',
          ],
          correctIndex: 2,
          explanation: 'UForm + UFormField están integrados para leer los issues que devuelve Zod y mostrarlos junto al campo con el name correspondiente.',
        },
        {
          question: '¿Por qué Django sigue necesitando validar los datos aunque el formulario ya los valide con Zod?',
          options: [
            'No es necesario, Zod es suficiente',
            'Porque cualquiera puede enviar una petición directa saltándose el navegador y el formulario',
            'Porque Zod no funciona con Django',
            'Solo por estilo de código',
          ],
          correctIndex: 1,
          explanation: 'La validación del cliente mejora la experiencia de usuario, pero no es una barrera de seguridad: el servidor siempre debe validar de forma independiente.',
        },
      ],
    },
  };
})();
