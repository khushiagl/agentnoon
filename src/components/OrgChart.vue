<!-- File: src/components/OrgChart.vue -->
<template>
  <div class="space-y-4">
    <!-- Controls -->
    <div class="bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <button
          @click="layout = 'vertical'"
          :class="layout === 'vertical' ? 'bg-blue-600 text-white' : 'border border-gray-300'"
          class="px-2 py-1 rounded flex items-center gap-1 text-sm"
        >
          <LayoutGrid class="w-4 h-4" />
          Family
        </button>
        <button
          @click="layout = 'horizontal'"
          :class="layout === 'horizontal' ? 'bg-blue-600 text-white' : 'border border-gray-300'"
          class="px-2 py-1 rounded flex items-center gap-1 text-sm"
        >
          <LayoutList class="w-4 h-4" />
          Horiz
        </button>
      </div>

      <!-- Zoom controls -->
      <div class="flex items-center gap-2">
        <button
          @click="zoom = Math.max(0.1, zoom - 0.1)"
          :disabled="zoom <= 0.1"
          class="px-2 py-1 border rounded text-sm disabled:opacity-50"
        >
          <ZoomOut class="w-4 h-4" />
        </button>
        <span class="text-sm w-12 text-center">{{ (zoom * 100).toFixed(0) }}%</span>
        <button
          @click="zoom = Math.min(2, zoom + 0.1)"
          :disabled="zoom >= 2"
          class="px-2 py-1 border rounded text-sm disabled:opacity-50"
        >
          <ZoomIn class="w-4 h-4" />
        </button>
        <button
          v-if="zoom !== 1"
          @click="zoom = 1"
          class="ml-2 px-2 py-1 border rounded text-sm"
        >
          Reset
        </button>
      </div>

      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search..."
        class="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Chart -->
    <div class="bg-white rounded-xl shadow-lg p-4 overflow-auto">
      <!-- apply zoom via scale() -->
      <div
        class="origin-top-left inline-block"
        :style="{ transform: `scale(${zoom})` }"
      >
        <div
          :class="layout === 'vertical' ? 'vertical-family-tree' : 'horizontal-family-tree'"
          style="min-width: max-content; padding: 10px;"
        >
          <EmployeeNode
            :node="filteredData.root"
            :level="0"
            :layout="layout"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { LayoutList, LayoutGrid, ZoomIn, ZoomOut } from 'lucide-vue-next';
import EmployeeNode from './EmployeeNode.vue';

const props = defineProps({ data: { type: Object, required: true } });
const searchTerm = ref('');
const layout     = ref('vertical');
const zoom       = ref(1);

// stubbed filtering; plug in your real logic if needed
const filteredData = computed(() =>
  !searchTerm.value ? props.data : props.data
);
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
