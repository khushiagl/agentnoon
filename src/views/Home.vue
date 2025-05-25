<!-- File: src/views/Home.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Users class="w-5 h-5 text-white" />
            </div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OrgChart Analytics
            </h1>
          </div>

          <div v-if="orgData">
            <button
              @click="activeView = 'chart'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeView === 'chart'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-white/50'
              ]"
            >
              <Users class="w-4 h-4 inline mr-2" /> Org Chart
            </button>
            <button
              @click="activeView = 'analytics'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeView === 'analytics'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-white/50'
              ]"
            >
              <BarChart3 class="w-4 h-4 inline mr-2" /> Analytics
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Bar -->
    <section v-if="stats && activeView !== 'upload'" class="bg-white/60 backdrop-blur-sm border-b border-white/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">{{ stats.totalEmployees }}</div>
            <div class="text-sm text-gray-600">Total Employees</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ stats.totalCost }}</div>
            <div class="text-sm text-gray-600">Total Cost</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats.managementCost }}</div>
            <div class="text-sm text-gray-600">Management Cost</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ stats.icCost }}</div>
            <div class="text-sm text-gray-600">IC Cost</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ stats.managementRatio }}%</div>
            <div class="text-sm text-gray-600">Management Ratio</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section v-if="activeView === 'upload'" class="max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Upload Your Organization Data</h2>
          <p class="text-lg text-gray-600">
            Upload a CSV file with employee data to visualize your organizational hierarchy and analyze costs.
          </p>
        </div>
        <FileUpload @upload="handleFileUpload" :is-loading="isLoading" />
      </section>

      <section v-if="activeView === 'chart' && orgData">
        <OrgChart :data="orgData" />
      </section>

      <section v-if="activeView === 'analytics' && orgData">
        <Analytics :data="orgData" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Users, BarChart3 } from 'lucide-vue-next';
import FileUpload from '../components/FileUpload.vue';
import OrgChart from '../components/OrgChart.vue';
import Analytics from '../components/Analytics.vue';
import { useOrgData } from '../composables/useOrgData';

const activeView = ref('upload');
const { orgData, processCSV, isLoading } = useOrgData();

// Debug logging
onMounted(() => {
  console.log('Home mounted', { 
    initialView: activeView.value,
    hasData: !!orgData.value
  });
});

// Watch view changes
watch(activeView, (newView, oldView) => {
  console.log('View changed', {
    from: oldView,
    to: newView,
    hasData: !!orgData.value,
    dataRoot: orgData.value?.root?.id
  });
});

// Watch data changes
watch(orgData, (newData, oldData) => {
  console.log('Org data changed', {
    oldRoot: oldData?.root?.id,
    newRoot: newData?.root?.id,
    totalEmployees: newData?.totalEmployees,
    currentView: activeView.value
  });
}, { deep: true });

const handleFileUpload = (csvText) => {
  console.log('File upload started');
  processCSV(csvText);
  console.log('File processed, switching to chart view');
  activeView.value = 'chart';
};

const stats = computed(() => {
  if (!orgData.value) return null;
  const totalEmployees = orgData.value.totalEmployees || 0;
  const totalCost = orgData.value.totalCost || 0;
  const managementCost = orgData.value.managementCost || 0;
  const icCost = orgData.value.icCost || 0;
  return {
    totalEmployees,
    totalCost: totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    managementCost: managementCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    icCost: icCost.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    managementRatio: totalCost > 0 ? ((managementCost / totalCost) * 100).toFixed(1) : '0'
  };
});
</script>

<style scoped>
/* view-specific styles */
</style>