<script setup lang="ts">
import type { AdministrativeRescueDetail } from '~/interfaces/rescue/administrative';

const props = defineProps<{
  detail: AdministrativeRescueDetail;
}>();

const cardDetail = computed(() => administrativeDetailToCardDetail(props.detail));
</script>

<template>
  <OperationalRescueDetailGeneralTab
    :detail="cardDetail"
    hide-client-authorization
    hide-chat
    :editable="false"
  />
</template>
