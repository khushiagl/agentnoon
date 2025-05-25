<template>
  <div class="w-full">
    <div
      :class="[
        'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
        dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        isLoading ? 'opacity-50 pointer-events-none' : ''
      ]"
      @dragenter.prevent.stop="handleDrag"
      @dragover.prevent.stop="handleDrag"
      @dragleave.prevent.stop="handleDrag"
      @drop.prevent.stop="handleDrop"
    >
      <input
        type="file"
        accept=".csv"
        @change="handleChange"
        :disabled="isLoading"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div class="flex flex-col items-center space-y-4">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
          <div v-if="isLoading" class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <UploadIcon v-else class="w-8 h-8 text-white" />
        </div>

        <div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {{ isLoading ? 'Processing...' : 'Upload CSV File' }}
          </h3>
          <p class="text-gray-600 mb-4">Drop your employee data CSV here, or click to browse</p>
          <p class="text-sm text-gray-500">
            Expected columns: Employee Id, Name, Job Title, Email, Manager, Salary, Department, etc.
          </p>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
      <AlertCircleIcon class="w-5 h-5 text-red-500" />
      <span class="text-red-700">{{ error }}</span>
    </div>

    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 class="font-medium text-gray-900 mb-2 flex items-center">
        <FileTextIcon class="w-4 h-4 mr-2" />
        CSV Format Requirements
      </h4>
      <ul class="text-sm text-gray-600 space-y-1">
        <li><strong>Required columns:</strong> Employee Id, Name, Manager, Salary</li>
        <li><strong>Optional columns:</strong> Job Title, Email, Department, Location, Status</li>
        <li><strong>Manager field:</strong> Should contain the Employee Id of the manager (or empty for CEO)</li>
        <li><strong>Salary field:</strong> Numeric values for cost calculations</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Upload as UploadIcon, FileText as FileTextIcon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next';

const props = defineProps({
  isLoading: Boolean
});
const emit = defineEmits(['upload']);

const dragActive = ref(false);
const error = ref(null);

function handleDrag(e) {
  if (e.type === 'dragenter' || e.type === 'dragover') {
    dragActive.value = true;
  } else if (e.type === 'dragleave') {
    dragActive.value = false;
  }
}

function resetError() {
  error.value = null;
}

function handleDrop(e) {
  dragActive.value = false;
  resetError();
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
}

function handleChange(e) {
  resetError();
  const file = e.target.files && e.target.files[0];
  if (file) handleFile(file);
}

function handleFile(file) {
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    error.value = 'Please upload a CSV file';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    emit('upload', text);
  };
  reader.onerror = () => {
    error.value = 'Error reading file';
  };
  reader.readAsText(file);
}
</script>

<style scoped>
/* any additional styles */
</style>
