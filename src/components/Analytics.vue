<template>
  <div class="bg-white rounded-lg shadow-lg p-8 text-center">
    <div class="mb-4">
      <BarChart3 class="w-12 h-12 mx-auto text-purple-600" />
    </div>
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
    <p class="text-gray-600">
      The analytics dashboard is coming soon. This will provide detailed insights about your organization's structure and costs.
    </p>
  </div>
</template>

<script setup>
import { BarChart3 } from 'lucide-vue-next';

defineProps({
  data: {
    type: Object,
    required: true
  }
});
</script> 