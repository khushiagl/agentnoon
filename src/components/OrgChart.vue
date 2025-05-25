<!-- File: src/components/OrgChart.vue -->
<template>
  <div class="space-y-6">
    <!-- Controls -->
    <div class="bg-white rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <button
          @click="layout = 'vertical'"
          :class="layout === 'vertical' ? 'bg-blue-600 text-white' : 'border border-gray-300'"
          class="px-3 py-1 rounded flex items-center gap-1"
        >
          <LayoutGrid class="w-4 h-4" />
          Family Tree
        </button>
        <button
          @click="layout = 'horizontal'"
          :class="layout === 'horizontal' ? 'bg-blue-600 text-white' : 'border border-gray-300'"
          class="px-3 py-1 rounded flex items-center gap-1"
        >
          <LayoutList class="w-4 h-4" />
          Horizontal
        </button>
      </div>
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search employees..."
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Chart -->
    <div class="bg-white rounded-xl shadow-lg p-6 overflow-auto">
      <div
        :class="layout === 'vertical' ? 'vertical-family-tree' : 'horizontal-family-tree'"
        style="min-width: max-content; padding: 20px;"
      >
        <EmployeeNode :node="filteredData.root" :level="0" :layout="layout" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { LayoutList, LayoutGrid } from 'lucide-vue-next';
import EmployeeNode from './EmployeeNode.vue';

const props = defineProps({ data: { type: Object, required: true } });
const searchTerm = ref('');
const layout = ref('vertical');

// Add logging when component receives data
console.log('OrgChart received data:', {
  root: props.data.root ? {
    id: props.data.root.id,
    name: props.data.root.data.Name,
    jobTitle: props.data.root.data['Job Title'],
    children: props.data.root.children?.length
  } : null,
  metrics: {
    totalEmployees: props.data.totalEmployees,
    totalCost: props.data.totalCost
  }
});

const filteredData = computed(() => {
  if (!searchTerm.value) return props.data;
  // Add search filtering logic here if needed
  return props.data;
});
</script>

<style scoped>
.vertical-family-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.horizontal-family-tree {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
</style>
