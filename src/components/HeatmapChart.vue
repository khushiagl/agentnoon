<template>
    <div class="space-y-4">
      <!-- Heatmap Controls -->
      <div class="flex flex-wrap gap-4 items-center mb-4">
        <div class="w-48">
          <label class="block text-sm font-medium text-gray-700 mb-1">Rows</label>
          <select v-model="rowDim" class="w-full">
            <option value="Department">Department</option>
            <option value="Entity">Entity</option>
            <option value="Location">Location</option>
            <option value="level">Level</option>
          </select>
        </div>
        <div class="w-48">
          <label class="block text-sm font-medium text-gray-700 mb-1">Columns</label>
          <select v-model="colDim" class="w-full">
            <option value="Entity">Entity</option>
            <option value="Department">Department</option>
            <option value="Location">Location</option>
            <option value="level">Level</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="block text-sm font-medium text-gray-700">Metric</label>
          <button @click="metricMode = 'count'"
                  :class="{ 'font-bold text-blue-600': metricMode === 'count' }"
                  class="px-2 py-1 rounded hover:bg-gray-100">#</button>
          <button @click="metricMode = 'pct'"
                  :class="{ 'font-bold text-blue-600': metricMode === 'pct' }"
                  class="px-2 py-1 rounded hover:bg-gray-100">%</button>
        </div>
      </div>
  
      <!-- Heatmap Canvas -->
      <div class="bg-white p-4 rounded-lg shadow-sm">
        <h3 class="text-base font-medium text-gray-900 mb-2">
          {{ rowDim }} × {{ colDim }} Heatmap ({{ metricMode === 'count' ? 'Headcount' : '% of Total' }})
        </h3>
        <div class="h-[400px]">
          <canvas ref="heatmapCanvas" class="w-full h-full"></canvas>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, computed } from 'vue';
  import { Chart, Tooltip, Legend, LinearScale } from 'chart.js';
  import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
  
  Chart.register(MatrixController, MatrixElement, Tooltip, Legend, LinearScale);
  
  const props = defineProps({
    data: { type: Object, required: true }
  });
  
  const nodes = computed(() => props.data.root.descendants().map(d => d.data.data));
  
  // Control state
  const rowDim = ref('Department');
  const colDim = ref('Entity');
  const metricMode = ref('count');
  
  // Compute matrix data whenever nodes or dims change
  const matrixData = computed(() => {
    const counts = {};
    const rowSet = new Set();
    const colSet = new Set();
  
    nodes.value.forEach(item => {
      const rv = item[rowDim.value] || 'Unassigned';
      const cv = item[colDim.value] || 'Unassigned';
      rowSet.add(rv);
      colSet.add(cv);
      counts[rv] = counts[rv] || {};
      counts[rv][cv] = (counts[rv][cv] || 0) + 1;
    });
  
    const rows = Array.from(rowSet).sort();
    const cols = Array.from(colSet).sort();
    let max = 0;
  
    const cells = rows.flatMap((rv, y) =>
      cols.map((cv, x) => {
        const v = counts[rv]?.[cv] || 0;
        max = Math.max(max, v);
        return { x, y, v };
      })
    );
  
    return { rows, cols, cells, max };
  });
  
  // Canvas ref and chart handle
  const heatmapCanvas = ref(null);
  let heatChart = null;
  
  // Helper to compute display value
  function displayValue(v, max) {
    if (metricMode.value === 'count') return v;
    return max ? +(v / nodes.value.length * 100).toFixed(1) : 0;
  }
  
  function drawHeatmap() {
    if (!heatmapCanvas.value) return;
    if (heatChart) heatChart.destroy();
  
    const ctx = heatmapCanvas.value.getContext('2d');
    const { rows, cols, cells, max } = matrixData.value;
  
    heatChart = new Chart(ctx, {
      type: 'matrix',
      data: {
        datasets: [{
          label: 'Heatmap',
          data: cells.map(c => ({ x: c.x, y: c.y, v: displayValue(c.v, max) })),
          backgroundColor: ctx => {
            const v = ctx.dataset.data[ctx.dataIndex].v;
            const pct = metricMode.value === 'count' ? (v / max) : (v / 100);
            const alpha = 0.3 + 0.7 * pct;
            return `rgba(59,129,246,${alpha})`;
          },
          borderWidth: 1,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            position: 'top',
            ticks: { callback: idx => cols[idx] },
            grid: { display: false }
          },
          y: {
            type: 'linear',
            reverse: true,
            ticks: { callback: idx => rows[idx] },
            grid: { display: false }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: items => `${rows[items[0].parsed.y]} × ${cols[items[0].parsed.x]}`,
              label: ctx => metricMode.value === 'count'
                ? `Headcount: ${ctx.raw.v}`
                : `Pct: ${ctx.raw.v}%`
            }
          },
          legend: { display: false }
        }
      }
    });
  }
  
  onMounted(drawHeatmap);
  watch([matrixData, metricMode], drawHeatmap, { deep: true });
  </script>
  
  <style scoped>
  select { border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.5rem; }
  </style>
  