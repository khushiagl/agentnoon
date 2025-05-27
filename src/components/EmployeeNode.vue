<template>
  <div :class="layout === 'vertical' ? 'flex flex-col items-center' : 'flex flex-col'">
    <!-- Employee Card -->
    <div class="relative">
      <div class="w-80 flex flex-col rounded-lg shadow hover:shadow-lg transition-all overflow-hidden bg-white">
        <!-- Header -->
        <div :class="`p-3 ${bgColorClass} flex-shrink-0 flex items-center justify-between`">
          <div class="flex items-center gap-2">
            <div
              class="h-8 w-8 flex-shrink-0 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium text-white"
            >
              {{ initials }}
            </div>
            <div class="flex flex-col">
              <h3 class="text-white font-medium text-sm leading-tight">
                {{ record.Name }}
              </h3>
              <p v-if="record['Job Title']" class="text-white/90 text-xs leading-snug">
                {{ record['Job Title'] }}
              </p>
            </div>
          </div>
          <button
            v-if="hasChildren"
            @click="toggle"
            class="px-2 py-1 bg-white/20 rounded-full text-white text-xs font-medium flex items-center gap-1"
          >
            <span>{{ record.directCount }}⁄{{ record.descendantCount }}</span>
            <component :is="isExpanded ? ChevronDown : ChevronRight" class="w-4 h-4" />
          </button>
        </div>

        <!-- Metrics Grid -->
        <div class="py-1 px-2 grid grid-cols-2 gap-1">
          <!-- Level -->
          <div class="bg-gray-50 py-1 px-2 rounded-lg flex flex-col items-center justify-center">
            <div class="text-sm font-medium text-black">
              {{ level + 1 }}
            </div>
            <div class="text-xs text-gray-600 font-normal text-center">Level</div>
          </div>
          <!-- Total Cost -->
          <div class="bg-blue-50 py-1 px-2 rounded-lg flex flex-col items-center justify-center">
            <div class="text-sm font-medium text-black">
              ${{ (record.totalCost / 1e6).toFixed(1) }}M
            </div>
            <div class="text-xs text-gray-600 font-normal text-center">Total Cost</div>
          </div>
          <!-- IC Cost -->
          <div class="bg-green-50 py-1 px-2 rounded-lg flex flex-col items-center justify-center">
            <div class="text-sm font-medium text-black">
              ${{ (record.icCost / 1e6).toFixed(1) }}M
            </div>
            <div class="text-xs text-gray-600 font-normal text-center">IC Cost</div>
          </div>
          <!-- Management Cost -->
          <div class="bg-purple-50 py-1 px-2 rounded-lg flex flex-col items-center justify-center">
            <div class="text-sm font-medium text-black">
              ${{ (record.managementCost / 1e6).toFixed(1) }}M
            </div>
            <div class="text-xs text-gray-600 font-normal text-center">Management Cost</div>
          </div>
          <!-- Management Ratio -->
          <div class="col-span-2 bg-orange-50 py-1 px-2 rounded-lg flex flex-col items-center justify-center">
            <div class="text-sm font-medium text-black">{{ mgmtRatio }}%</div>
            <div class="text-xs text-gray-600 font-normal text-center">Management Ratio</div>
          </div>
        </div>

        <!-- Footer Icons -->
        <div class="border-t border-gray-100 px-3 py-1 flex flex-col gap-1 text-xs text-gray-600">
          <div class="flex items-center">
            <Users class="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{{ record.Department }}</span>
          </div>
          <div class="flex items-center">
            <MapPin class="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{{ record.Location }}</span>
          </div>
        </div>
      </div>

      <!-- Parent connectors -->
      <div
        v-if="hasChildren && isExpanded && layout === 'vertical'"
        class="absolute left-1/2 top-full border-l-2 border-gray-300"
        style="transform: translateX(-50%); height: 1rem;"
      />
      <div
        v-if="hasChildren && isExpanded && layout === 'horizontal'"
        class="absolute left-full top-1/2 border-t-2 border-gray-300"
        style="transform: translateY(-50%); width: 1rem;"
      />
    </div>

    <!-- Children -->
    <div v-if="hasChildren && isExpanded">
      <!-- Vertical layout -->
      <div v-if="layout === 'vertical'" class="mt-3 inline-flex items-center relative">
        <div class="absolute top-0 left-0 right-0 border-t-2 border-gray-300" />
        <div class="flex gap-3 pt-2">
          <EmployeeNode
            v-for="child in childrenNodes"
            :key="child.id"
            :node="child"
            :level="level + 1"
            :layout="layout"
          />
        </div>
      </div>
      <!-- Horizontal layout -->
      <div v-else class="ml-3 mt-2 flex relative">
        <div
          class="absolute left-0 top-1/2 border-t-2 border-gray-300"
          style="transform: translateY(-50%); width: 1rem;"
        />
        <div class="absolute left-4 top-0 bottom-0 border-l-2 border-gray-300" />
        <div class="ml-7 flex flex-col justify-start space-y-3">
          <div
            v-for="child in childrenNodes"
            :key="child.id"
            class="relative flex items-center"
          >
            <div
              class="absolute left-0 top-1/2 border-t-2 border-gray-300"
              style="transform: translateY(-50%); width: 1rem;"
            />
            <EmployeeNode :node="child" :level="level + 1" :layout="layout" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronDown, ChevronRight, Users, MapPin } from 'lucide-vue-next';

const props = defineProps({
  node:   { type: Object, required: true },
  level:  { type: Number, default: 0 },
  layout: { type: String, default: 'vertical' }
});

const isExpanded   = ref(props.level < 2);
const toggle       = () => { isExpanded.value = !isExpanded.value; };

const record        = computed(() => props.node.data.data);
const hasChildren   = computed(() => props.node.children?.length > 0);
const childrenNodes = computed(() => props.node.children || []);

const mgmtRatio = computed(() => {
  const t = record.value.totalCost;
  return t ? (record.value.managementCost / t * 100).toFixed(1) : '0.0';
});

const initials = computed(() => {
  const full = record.value.Name || '';
  return full.split(' ').map(w => w[0]).join('').toUpperCase();
});
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
/* no additional overrides needed */
</style>
