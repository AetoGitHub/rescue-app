(function () {
  const { codeBlock, calloutTip, djangoVsVue } = window.Learn;

  window.LearnContent = window.LearnContent || {};
  window.LearnContent['nuxt-ui-tailwind'] = {
    id: 'nuxt-ui-tailwind',
    title: 'Nuxt UI + Tailwind CSS',
    icon: '🎨',
    estimatedMinutes: 12,
    sections: [
      {
        heading: 'Nuxt UI: una librería de componentes',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p>Los widgets del admin de Django (<code>forms.Select</code>, <code>forms.DateInput</code>...), pero para toda tu interfaz, no solo el admin.</p>',
            vue: '<p><strong>Nuxt UI</strong> da componentes ya construidos y accesibles: <code>UButton</code>, <code>UBadge</code>, <code>UTooltip</code>, <code>UModal</code>, <code>USlideover</code>, <code>UTable</code>, <code>UDashboardPanel</code>... En vez de escribir un botón desde cero, usas <code>&lt;UButton&gt;</code> con props.</p>',
          })}
        `,
      },
      {
        heading: 'Utility classes de Tailwind',
        bodyHtml: `
          <p>Tailwind no da componentes — da clases CSS pequeñas y combinables que aplicas directo en el HTML, en vez de escribir CSS separado:</p>
          ${codeBlock('html', `
<!-- CSS tradicional: escribes una clase y su regla en otro archivo -->
<div class="tarjeta-usuario">...</div>

<!-- Tailwind: compones el estilo con clases utilitarias en el propio HTML -->
<div class="flex items-center gap-2 rounded-lg border p-4">...</div>
          `)}
          <p><code>flex</code> = display:flex, <code>items-center</code> = align-items:center, <code>gap-2</code> = espacio entre hijos, <code>rounded-lg</code> = border-radius, <code>p-4</code> = padding. Se combinan libremente.</p>
        `,
      },
      {
        heading: 'Props semánticas: color y variant',
        bodyHtml: `
          <p>Los componentes de Nuxt UI no reciben colores como texto libre, sino como <strong>props semánticas</strong> con un set fijo de valores:</p>
          ${codeBlock('vue', `
<UBadge color="warning" variant="subtle" label="Pendiente" />
<UButton color="primary" variant="solid" label="Guardar" />
          `)}
          <p><code>color</code> se elige del tema (<code>primary</code>, <code>warning</code>, <code>error</code>, <code>success</code>, <code>neutral</code>...) y <code>variant</code> controla el "peso visual" (<code>solid</code>, <code>subtle</code>, <code>outline</code>, <code>ghost</code>). Cambiar el tema global cambia todos los componentes a la vez, sin tocar cada uno.</p>
        `,
      },
      {
        heading: 'Slots: huecos con nombre',
        bodyHtml: `
          ${djangoVsVue({
            django: '<p><code>{% block sidebar %}{% endblock %}</code> en un template base.</p>',
            vue: '<p>Un slot con nombre: <code>&lt;template #leading&gt;...&lt;/template&gt;</code> dentro de un componente hijo.</p>',
          })}
          ${codeBlock('vue', `
<UDashboardNavbar :title="title">
  <template #leading>
    <UDashboardSidebarCollapse />
  </template>
  <template #right>
    <UColorModeSwitch />
  </template>
</UDashboardNavbar>
          `)}
        `,
      },
      {
        heading: 'Leyendo UnlockCountdown.vue completo',
        bodyHtml: `
          <p>Con todo lo visto hasta ahora, este componente real ya se lee de corrido:</p>
          ${codeBlock('vue', `
<script setup lang="ts">
const props = withDefaults(
  defineProps<{ unlockedUntil: string | null | undefined; compact?: boolean }>(),
  { compact: false },
);

const { isActive, isExpired, remainingLabel } = useRescueUnlockCountdown(
  () => props.unlockedUntil,
);

const visible = computed(() => isActive.value || isExpired.value);
</script>

<template>
  <UTooltip v-if="visible" :text="\`Tiempo restante: \${remainingLabel}\`">
    <UBadge
      :color="isExpired ? 'warning' : 'info'"
      :icon="isExpired ? 'i-lucide-clock' : 'i-lucide-lock-open'"
      :label="label"
      :size="compact ? 'sm' : 'md'"
      variant="subtle"
    />
  </UTooltip>
</template>
          `)}
          <p>Props tipadas (módulo 3) + composable (módulo 6) + computed (módulo 4) + componentes de Nuxt UI con props semánticas (esta sección) = un componente completo de ~20 líneas.</p>
        `,
      },
    ],
    playground: {
      starterCode: `
// Este es el único módulo que carga Tailwind (vía CDN) para poder editar
// utility classes en vivo — de forma aislada, solo para este ejercicio.
function iniciar() {
  const { createApp, ref } = Vue;

  const App = {
    setup() {
      const urgente = ref(false);
      return { urgente };
    },
    template: \`
      <div class="font-sans">
        <button
          @click="urgente = !urgente"
          class="mb-3 rounded-md border px-3 py-1.5 text-sm cursor-pointer"
        >
          Alternar urgente
        </button>
        <div
          class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
          :class="urgente ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
        >
          {{ urgente ? '🔴 Urgente' : '🟢 Normal' }}
        </div>
      </div>
    \`,
  };

  createApp(App).mount(mountEl);
}

if (window.tailwind) {
  iniciar();
} else {
  const script = document.createElement('script');
  script.src = 'https://cdn.tailwindcss.com';
  script.onload = iniciar;
  document.head.appendChild(script);
}

// Reto: agrega una tercera clase de color (ej. "bg-amber-100 text-amber-700")
// para un tercer estado, y un botón que lo active
`,
      solutionCode: `
function iniciar() {
  const { createApp, ref } = Vue;

  const App = {
    setup() {
      const estado = ref('normal'); // 'normal' | 'urgente' | 'en_espera'
      return { estado };
    },
    template: \`
      <div class="font-sans space-x-2">
        <button @click="estado = 'normal'" class="rounded-md border px-3 py-1.5 text-sm cursor-pointer">Normal</button>
        <button @click="estado = 'urgente'" class="rounded-md border px-3 py-1.5 text-sm cursor-pointer">Urgente</button>
        <button @click="estado = 'en_espera'" class="rounded-md border px-3 py-1.5 text-sm cursor-pointer">En espera</button>
        <div class="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
          :class="{
            'bg-emerald-100 text-emerald-700': estado === 'normal',
            'bg-red-100 text-red-700': estado === 'urgente',
            'bg-amber-100 text-amber-700': estado === 'en_espera',
          }"
        >
          {{ estado }}
        </div>
      </div>
    \`,
  };

  createApp(App).mount(mountEl);
}

if (window.tailwind) {
  iniciar();
} else {
  const script = document.createElement('script');
  script.src = 'https://cdn.tailwindcss.com';
  script.onload = iniciar;
  document.head.appendChild(script);
}
`,
    },
    quiz: {
      passThreshold: 0.7,
      questions: [
        {
          question: '¿Qué diferencia hay entre Nuxt UI y Tailwind CSS?',
          options: [
            'Son la misma librería con dos nombres distintos',
            'No se pueden usar juntos',
            'Tailwind da componentes; Nuxt UI da clases CSS',
            'Nuxt UI da componentes ya construidos; Tailwind da clases utilitarias para estilos',
          ],
          correctIndex: 3,
          explanation: 'Nuxt UI (componentes como UButton, UBadge) está construido sobre Tailwind (utility classes) y Reka UI — son capas complementarias, no alternativas.',
        },
        {
          question: 'En <UBadge color="warning" variant="subtle" />, ¿qué controla variant?',
          options: [
            'El idioma del texto',
            'La posición en la pantalla',
            'El "peso visual" del componente (solid, subtle, outline, ghost)',
            'El tamaño en píxeles exactos',
          ],
          correctIndex: 2,
          explanation: 'variant define qué tan "fuerte" se ve el componente visualmente, mientras que color define de qué color del tema se toma.',
        },
        {
          question: '¿Qué es un slot con nombre como #leading en <UDashboardNavbar>?',
          options: [
            'Una prop más, igual que cualquier otra',
            'Un "hueco" del componente hijo donde el padre puede insertar contenido propio',
            'Un evento que se emite al hacer click',
            'Un tipo de dato de TypeScript',
          ],
          correctIndex: 1,
          explanation: 'Un slot es un punto de extensión del componente hijo: el padre decide qué renderizar ahí, similar a un {% block %} de un template base en Django.',
        },
      ],
    },
  };
})();
