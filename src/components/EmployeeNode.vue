<template>
    <div :class="layout === 'vertical' ? 'flex flex-col items-center' : 'flex flex-col'">
      <!-- Employee Card -->
      <div class="relative">
        <div class="w-64 h-52 flex flex-col rounded-lg shadow hover:shadow-lg transition-all overflow-hidden">
          <!-- Header -->
          <div :class="`h-20 p-3 ${bgColorClass} flex-shrink-0 flex flex-col justify-center`">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-start gap-2 min-w-0 flex-1">
                <div
                  class="h-9 w-9 flex-shrink-0 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white"
                >
                  {{ initials }}
                </div>
                <div class="min-w-0 flex-1 flex flex-col justify-center items-start">
                  <h3 class="font-medium text-sm text-white break-words leading-tight text-left w-full">
                    {{ record.Name }}
                  </h3>
                  <p
                    v-if="record['Job Title']"
                    class="text-white/90 text-xs break-words mt-0.5 leading-tight text-left w-full"
                  >
                    {{ record['Job Title'] }}
                  </p>
                </div>
              </div>
  
              <button
                v-if="hasChildren"
                @click="toggle"
                class="p-1.5 hover:bg-white/20 rounded transition-colors flex items-center gap-1.5 flex-shrink-0 self-start"
              >
                <span class="text-white/90 text-xs font-medium">
                  {{ record.directCount }}⁄{{ record.descendantCount }}
                </span>
                <component
                  :is="isExpanded ? ChevronDown : ChevronRight"
                  class="w-4 h-4 text-white"
                />
              </button>
            </div>
          </div>
  
          <!-- Body -->
          <div class="bg-white p-3 flex-1 flex flex-col justify-between">
            <!-- Metrics -->
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-medium text-gray-600">Mgmt:</span>
                  <span class="text-xs bg-blue-50 px-2 py-0.5 rounded-full">
                    ${{ (record.managementCost/1e6).toFixed(1) }}M
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-medium text-gray-600">IC:</span>
                  <span class="text-xs bg-green-50 px-2 py-0.5 rounded-full">
                    ${{ (record.icCost/1e6).toFixed(1) }}M
                  </span>
                </div>
              </div>
              <div class="space-y-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-medium text-gray-600">Total:</span>
                  <span class="text-xs bg-gray-50 px-2 py-0.5 rounded-full">
                    ${{ (record.totalCost/1e6).toFixed(1) }}M
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-medium text-gray-600">Ratio:</span>
                  <span class="text-xs bg-purple-50 px-2 py-0.5 rounded-full">
                    {{ mgmtRatio }}
                  </span>
                </div>
              </div>
            </div>
  
            <!-- Department and Location -->
            <div class="border-t border-gray-100 pt-2 mt-2 space-y-1.5">
              <div v-if="record.Department" class="flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span class="text-xs text-gray-600 break-words">{{ record.Department }}</span>
              </div>
              <div v-if="record.Location" class="flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span class="text-xs text-gray-600 break-words">{{ record.Location }}</span>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Parent connector -->
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
        <!-- Vertical layout (unchanged) -->
        <div
          v-if="layout === 'vertical'"
          class="mt-4 inline-flex items-center relative"
        >
          <div class="absolute top-0 left-0 right-0 border-t-2 border-gray-300" />
          <div class="flex gap-4 pt-2">
            <EmployeeNode
              v-for="child in childrenNodes"
              :key="child.id"
              :node="child"
              :level="level + 1"
              :layout="layout"
            />
          </div>
        </div>
  
        <!-- Horizontal layout (improved connectors) -->
        <div
          v-else
          class="ml-4 mt-2 flex relative"
        >
          <!-- horizontal leg from parent -->
          <div
            class="absolute left-0 top-1/2 border-t-2 border-gray-300"
            style="transform: translateY(-50%); width: 1rem;"
          />
          <!-- vertical spine covering exactly the span of direct children -->
          <div
            class="absolute left-4 top-0 bottom-0 border-l-2 border-gray-300"
          />
          <div class="ml-8 flex flex-col justify-start space-y-4">
            <div
              v-for="child in childrenNodes"
              :key="child.id"
              class="relative flex items-center"
            >
              <!-- tee connector aligned at center -->
              <div
                class="absolute left-0 top-1/2 border-t-2 border-gray-300"
                style="transform: translateY(-50%); width: 1rem;"
              />
              <EmployeeNode
                :node="child"
                :level="level + 1"
                :layout="layout"
              />
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
    return t ? (record.value.managementCost / t).toFixed(2) : '0.00';
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
  const bgColorClass = computed(
    () => `bg-gradient-to-r ${levelColors[props.level % levelColors.length]}`
  );
  </script>
  
  <style scoped>
  /* no additional overrides needed */
  </style>