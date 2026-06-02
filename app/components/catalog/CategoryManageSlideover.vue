<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { MultipurposeCatalogueType } from '~/constants/multipurpose-catalog';
import type { Category } from '~/interfaces/catalogs/category';
import {
  adminListSlideoverBodyUi,
  adminListTableClass,
} from '~/constants/admin-list-layout';

const props = withDefaults(
  defineProps<{
    catalogueType?: MultipurposeCatalogueType;
    title?: string;
    description?: string;
    searchPlaceholder?: string;
    newItemLabel?: string;
    createTitle?: string;
    editTitle?: string;
    successCreateLabel?: string;
    successEditLabel?: string;
    namePlaceholder?: string;
  }>(),
  {
    catalogueType: 'service_category',
    title: 'Categorías de servicio',
    description: 'Gestiona las categorías usadas al registrar servicios.',
    searchPlaceholder: 'Buscar categoría',
    newItemLabel: 'Nueva categoría',
    createTitle: 'Nueva categoría',
    editTitle: 'Editar categoría',
    successCreateLabel: 'Categoría creada',
    successEditLabel: 'Categoría actualizada',
    namePlaceholder: 'Ej. Grúas',
  },
);

const open = defineModel<boolean>('open', { default: false });

const categoryCrudRef = ref<{
  prepareCreate: () => void;
  openEdit: (id: number, name: string) => void;
} | null>(null);

const tableRef = useTemplateRef('table');
const search = ref('');

function onRowSelect(_e: Event, row: TableRow<Category>) {
  const { id, name } = row.original;
  if (id != null) {
    categoryCrudRef.value?.openEdit(id, name);
  }
}

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = useCatalogInfiniteList<Category>({
  key: () => ['catalog-multipurpose', props.catalogueType],
  path: '/api/catalogue/multipurpose/list/',
  query: { type: props.catalogueType },
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return rows.value;
  return rows.value.filter((row) => row.name.toLowerCase().includes(q));
});

const columns: TableColumn<Category>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'catalogue_type', header: 'Tipo de catálogo' },
];
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{
      content: 'max-w-2xl flex flex-col',
      body: adminListSlideoverBodyUi.body,
    }"
  >
    <template #body>
      <div class="flex min-h-0 flex-1 flex-col gap-4">
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <UInput
            v-model="search"
            leading-icon="i-lucide-search"
            :placeholder="searchPlaceholder"
            class="min-w-0 flex-1"
            variant="subtle"
          />
          <UButton
            icon="i-lucide-plus"
            :label="newItemLabel"
            @click="categoryCrudRef?.prepareCreate()"
          />
        </div>

        <UTable
          ref="table"
          sticky
          :class="adminListTableClass"
          :columns="columns"
          :data="filteredRows"
          :loading="isInitialLoading"
          :get-row-id="(row: Category) => String(row.id)"
          @select="onRowSelect"
        />
      </div>

      <CatalogCategoryCreateSlideover
        ref="categoryCrudRef"
        :show-trigger="false"
        :catalogue-type="catalogueType"
        :create-title="createTitle"
        :edit-title="editTitle"
        :new-item-label="newItemLabel"
        :success-create-label="successCreateLabel"
        :success-edit-label="successEditLabel"
        :name-placeholder="namePlaceholder"
      />
    </template>
  </USlideover>
</template>
