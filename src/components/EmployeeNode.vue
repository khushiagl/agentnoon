<template>
  <div :class="layout === 'vertical' ? 'flex flex-col items-center' : 'flex flex-col'">
    <!-- Employee Card -->
    <div class="relative">
      <div
        class="w-56 p-4 rounded shadow hover:shadow-lg transition-all"
        :class="bgColorClass"
      >
        <!-- Avatar and Name -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div
              class="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white"
            >
              {{ initials }}
            </div>
            <div>
              <h3 class="font-medium text-sm text-white truncate max-w-[100px]">
                {{ record.Name }}
              </h3>
              <p
                v-if="record['Job Title']"
                class="text-white/80 text-xs truncate max-w-[120px]"
              >
                {{ record['Job Title'] }}
              </p>
            </div>
          </div>
          <button
            v-if="hasChildren"
            @click="toggle"
            class="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <component
              :is="isExpanded ? ChevronDown : ChevronRight"
              class="w-4 h-4 text-white"
            />
          </button>
        </div>

        <!-- Cost and Stats -->
        <div class="mt-2 space-y-1 text-xs text-gray-900">
          <div>Descendants: {{ record.descendantCount }}</div>
          <div class="flex flex-wrap gap-2">
            <span class="bg-blue-50 px-2 py-0.5 rounded">Mgmt: ${{ (record.managementCost/1e6).toFixed(1) }}M</span>
            <span class="bg-green-50 px-2 py-0.5 rounded">IC: ${{ (record.icCost/1e6).toFixed(1) }}M</span>
            <span class="bg-gray-50 px-2 py-0.5 rounded">Total: ${{ (record.totalCost/1e6).toFixed(1) }}M</span>
            <span class="bg-purple-50 px-2 py-0.5 rounded">Ratio: {{ mgmtRatio }}</span>
          </div>
          <div class="flex items-center justify-between border-t border-gray-100 pt-1 text-gray-600">
            <div v-if="record.Department" class="flex items-center">
              <Users class="w-3 h-3 mr-1" />
              <span class="truncate max-w-[80px]">
                {{ record.Department }}
              </span>
            </div>
            <div v-if="record.Location" class="flex items-center">
              <MapPin class="w-3 h-3 mr-1" />
              <span class="truncate max-w-[70px]">
                {{ record.Location }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Connectors -->
      <div
        v-if="hasChildren && isExpanded"
        :class="layout === 'vertical' ? 'absolute border-l-2 border-gray-300 left-1/2 top-full h-8' : 'absolute border-t-2 border-gray-300 left-full top-1/2 w-5'"
      />
    </div>

    <!-- Children -->
    <div
      v-if="hasChildren && isExpanded"
      :class="layout === 'vertical' ? 'mt-8 relative' : 'ml-[76px] mt-2 relative'"
    >
      <!-- Horizontal connector for multiple children -->
      <div
        v-if="childrenNodes.length > 1"
        :class="layout === 'vertical' ? 'absolute border-t-2 border-gray-300' : 'absolute border-l-2 border-gray-300'"
        :style="layout === 'vertical' ? {
          top: '-30px',
          left: `calc(${100 / childrenNodes.length / 2}% - 1px)`,
          right: `calc(${100 / childrenNodes.length / 2}% - 1px)`
        } : {
          left: '-20px',
          top: '0',
          height: 'calc(100% - 35px)'
        }"
      />

      <!-- Children container -->
      <div :class="layout === 'vertical' ? 'flex gap-8 justify-center' : 'space-y-6'">
        <template v-for="(child, idx) in childrenNodes" :key="child.id">
          <!-- Vertical layout child -->
          <div v-if="layout === 'vertical'" class="relative">
            <div
              class="absolute border-l-2 border-gray-300"
              style="left:50%; top:-30px; height:30px;"
            />
            <EmployeeNode
              :node="child"
              :level="level + 1"
              :layout="layout"
            />
          </div>

          <!-- Horizontal layout child -->
          <li v-else class="relative mt-4">
            <div
              v-if="idx > 0"
              class="absolute border-l-2 border-gray-300"
              style="left:-20px; top:-36px; height:36px;"
            />
            <div
              class="absolute border-t-2 border-gray-300"
              style="width:20px; left:-20px; top:50%;"
            />
            <EmployeeNode
              :node="child"
              :level="level + 1"
              :layout="layout"
            />
          </li>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronDown, ChevronRight, Users, MapPin } from 'lucide-vue-next';

const props = defineProps({
  node: { type: Object, required: true },
  level: { type: Number, default: 0 },
  layout: { type: String, default: 'vertical' }
});

// Local state
const isExpanded = ref(props.level < 2);
const toggle = () => { isExpanded.value = !isExpanded.value; };

// Data mapping: point to the CSV row with precomputed fields
const record = computed(() => props.node.data.data);
const hasChildren = computed(() => Array.isArray(props.node.children) && props.node.children.length > 0);
const childrenNodes = computed(() => props.node.children || []);

// Management ratio
const mgmtRatio = computed(() => {
  if (!record.value.totalCost) return '0.00';
  return (record.value.managementCost / record.value.totalCost).toFixed(2);
});

// Initials from Name
const initials = computed(() => {
  const full = record.value.Name || '';
  return full
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase();
});

// Background gradient per level
const levelColors = [
  'from-blue-600 to-blue-700',
  'from-purple-600 to-purple-700',
  'from-green-600 to-green-700',
  'from-orange-600 to-orange-700',
  'from-red-600 to-red-700',
  'from-indigo-600 to-indigo-700'
];
const bgColorClass = computed(() => `bg-gradient-to-r ${levelColors[props.level % levelColors.length]}`);
</script>

<style scoped>
/* Add any overrides here */
</style>
  