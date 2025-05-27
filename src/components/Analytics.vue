<template>
  <div class="space-y-4 p-4">
    <!-- Controls -->
    <div class="flex flex-wrap gap-4 items-center mb-4">
      <div class="w-48">
        <label class="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
        <select v-model="chartType" class="w-full border rounded p-2 text-sm">
          <option value="compDist">Compensation Distribution</option>
          <option value="stackedCost">100% Stacked Cost</option>
        </select>
      </div>
      <div v-if="chartType==='compDist'" class="w-48">
        <label class="block text-sm font-medium text-gray-700 mb-1">Metric</label>
        <select v-model="selectedMetric" class="w-full border rounded p-2 text-sm">
          <option value="totalComp">Total Compensation</option>
          <option value="headcount">Headcount</option>
          <option value="avgComp">Average Compensation</option>
          <option value="pctComp">% of Total Compensation</option>
        </select>
      </div>
      <div class="w-48">
        <label class="block text-sm font-medium text-gray-700 mb-1">Dimension</label>
        <select v-model="selectedDimension" class="w-full border rounded p-2 text-sm">
          <option value="level">Level</option>
          <option value="Department">Department</option>
          <option value="Entity">Entity</option>
          <option value="Location">Location</option>
        </select>
      </div>
    </div>

    <!-- Main Chart -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
      <h3 class="text-base font-medium text-gray-900 mb-2">
        <span v-if="chartType==='compDist'">Compensation Distribution: {{ selectedMetricLabel }} by {{ selectedDimensionLabel }}</span>
        <span v-else>100% Stacked IC vs. Management Cost by {{ selectedDimensionLabel }}</span>
      </h3>
      <div class="h-[300px]">
        <canvas ref="chartCanvas" class="w-full h-full"></canvas>
      </div>
    </div>

    <!-- Other Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <!-- Location Pie Chart -->
      <div class="bg-white p-4 rounded-lg shadow-sm">
        <h3 class="text-base font-medium text-gray-900 mb-2">Cost by Location</h3>
        <div class="h-[300px]"><canvas ref="locCanvas" class="w-full h-full"></canvas></div>
      </div>
      <!-- Performance Mixed Chart -->
      <div class="bg-white p-4 rounded-lg shadow-sm">
        <h3 class="text-base font-medium text-gray-900 mb-2">Performance vs Compensation & Headcount</h3>
        <div class="h-[300px]"><canvas ref="perfCanvas" class="w-full h-full"></canvas></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  LineController,
  LineElement
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  LineController,
  LineElement
);

const props = defineProps({ data: { type: Object, required: true } });
const nodes = computed(() => props.data.root.descendants().map(d => d.data.data));

// Controls
const chartType = ref('compDist');
const selectedMetric = ref('totalComp');
const selectedDimension = ref('level');

// Labels
const selectedDimensionLabel = computed(() => selectedDimension.value === 'level' ? 'Level' : selectedDimension.value);
const selectedMetricLabel = computed(() => {
  switch (selectedMetric.value) {
    case 'headcount': return 'Headcount';
    case 'avgComp': return 'Average Compensation';
    case 'pctComp': return '% of Total Compensation';
    default: return 'Total Compensation';
  }
});

// Chart refs
const chartCanvas = ref(null);
const perfCanvas = ref(null);
const locCanvas = ref(null);
let mainChart, perfChart, locChart;

// Performance mapping
const perfMap = {
  '💥 At Risk': 1,
  '⛔ Needs Improvement': 2,
  '👍 Meets Expectations': 3,
  '⭐ High Performer': 4,
  '👏 Exceeds Expectations': 5,
  '🏆 Outstanding': 6
};

// Common chart styling
const chartStyles = {
  bar: {
    backgroundColor: 'rgba(59,130,246,0.7)',
    borderRadius: 4,
    maxBarThickness: 40
  },
  line: {
    borderColor: 'rgba(234,88,12,0.7)',
    borderWidth: 2,
    tension: 0.3,
    fill: false
  },
  colors: [
    'rgba(59,130,246,0.7)',   // blue
    'rgba(234,88,12,0.7)',    // orange
    'rgba(16,185,129,0.7)',   // green
    'rgba(139,92,246,0.7)',   // purple
    'rgba(236,72,153,0.7)',   // pink
    'rgba(245,158,11,0.7)'    // amber
  ]
};

// Build data groups
function buildGroups(dim) {
  const map = new Map();
  nodes.value.forEach(r => {
    const key = dim === 'level' ? `Level ${+r.level}` : r[dim] || 'Unassigned';
    if (!map.has(key)) map.set(key, { ic: 0, mgmt: 0, total: 0, count: 0 });
    const entry = map.get(key);
    const comp = (+r.Salary || 0) + (+r.Bonus || 0);
    const isMgmt = +r.directCount > 0;
    entry.total += comp;
    entry.count += 1;
    if (isMgmt) entry.mgmt += comp;
    else entry.ic += comp;
  });
  return Array.from(map.entries()).sort((a, b) => {
    if (dim === 'level') return +a[0].split(' ')[1] - +b[0].split(' ')[1];
    return a[0].localeCompare(b[0]);
  });
}

function buildCompDist() {
  const groups = buildGroups(selectedDimension.value);
  const totalAll = groups.reduce((s, [, v]) => s + v.total, 0);
  const labels = groups.map(([k]) => k);
  let data = [];
  if (selectedMetric.value === 'headcount') {
    data = groups.map(([, v]) => v.count);
  } else if (selectedMetric.value === 'avgComp') {
    data = groups.map(([, v]) => v.total / v.count);
  } else if (selectedMetric.value === 'pctComp') {
    data = groups.map(([, v]) => (v.total / totalAll) * 100);
  } else {
    data = groups.map(([, v]) => v.total);
  }
  return { labels, data };
}

function buildStacked() {
  const groups = buildGroups(selectedDimension.value);
  const labels = groups.map(([k]) => k);
  const icPerc = groups.map(([, v]) => (v.ic / v.total) * 100);
  const mgmtPerc = groups.map(([, v]) => (v.mgmt / v.total) * 100);
  return { labels, icPerc, mgmtPerc };
}

function buildPerformanceMixed() {
  const map = new Map();
  nodes.value.forEach(r => {
    const key = (r.Performance || '').trim();
    const score = perfMap[key]; if (!score) return;
    const comp = (+r.Salary || 0) + (+r.Bonus || 0);
    const entry = map.get(key) || { sum: 0, count: 0 };
    entry.sum += comp; entry.count += 1;
    map.set(key, entry);
  });
  const sorted = Array.from(map.entries()).sort((a, b) => perfMap[a[0]] - perfMap[b[0]]);
  const labels = sorted.map(([k]) => k);
  const avgComp = sorted.map(([, v]) => v.sum / v.count);
  const headcount = sorted.map(([, v]) => v.count);
  return { labels, avgComp, headcount };
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'top',
      labels: { 
        padding: 20,
        font: { size: 12 },
        usePointStyle: true
      }
    },
    tooltip: { 
      mode: 'nearest',
      padding: 8,
      cornerRadius: 4,
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleFont: { size: 13 },
      bodyFont: { size: 12 }
    }
  },
  scales: {
    x: { 
      grid: { display: false },
      ticks: { font: { size: 12 } }
    },
    y: { 
      beginAtZero: true,
      ticks: { font: { size: 12 } }
    }
  }
};

// Render main chart based on selection
function renderMainChart() {
  if (mainChart) mainChart.destroy();
  const ctx = chartCanvas.value.getContext('2d');
  if (chartType.value === 'stackedCost') {
    const { labels, icPerc, mgmtPerc } = buildStacked();
    mainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { 
            label: 'IC Cost %', 
            data: icPerc, 
            backgroundColor: chartStyles.colors[0], 
            borderRadius: chartStyles.bar.borderRadius,
            maxBarThickness: chartStyles.bar.maxBarThickness,
            stack: 'stack1' 
          },
          { 
            label: 'Mgmt Cost %', 
            data: mgmtPerc, 
            backgroundColor: chartStyles.colors[1], 
            borderRadius: chartStyles.bar.borderRadius,
            maxBarThickness: chartStyles.bar.maxBarThickness,
            stack: 'stack1' 
          }
        ]
      },
      options: {
        ...baseOptions,
        scales: { 
          y: { 
            ...baseOptions.scales.y,
            stacked: true, 
            max: 100, 
            ticks: { 
              ...baseOptions.scales.y.ticks,
              callback: v => v + '%' 
            } 
          }, 
          x: { 
            ...baseOptions.scales.x,
            stacked: true 
          } 
        }
      }
    });
  } else {
    const { labels, data } = buildCompDist();
    mainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ 
          label: selectedMetricLabel, 
          data, 
          backgroundColor: chartStyles.colors[0],
          borderRadius: chartStyles.bar.borderRadius,
          maxBarThickness: chartStyles.bar.maxBarThickness
        }]
      },
      options: {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: { display: false }
        }
      }
    });
  }
}

onMounted(() => {
  renderMainChart();

  // Location Pie
  const locGroups = buildGroups('Location');
  const lctx = locCanvas.value.getContext('2d');
  locChart = new Chart(lctx, {
    type: 'pie',
    data: { 
      labels: locGroups.map(([k]) => k), 
      datasets: [{ 
        data: locGroups.map(([, v]) => v.total), 
        backgroundColor: locGroups.map((_, i) => `hsla(${i*360/locGroups.length},70%,50%,0.8)`),
        borderWidth: 1 
      }] 
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 20,
            font: { size: 12 },
            generateLabels: chart => chart.data.labels.map((label, i) => ({
              text: `${label}: $${(chart.data.datasets[0].data[i]/1e6).toFixed(1)}M`,
              fillStyle: chart.data.datasets[0].backgroundColor[i],
              index: i
            }))
          }
        },
        tooltip: {
          mode: 'nearest',
          padding: 8,
          cornerRadius: 4
        }
      }
    }
  });

  // Performance Mixed
  const perfData = buildPerformanceMixed();
  const pctx = perfCanvas.value.getContext('2d');
  perfChart = new Chart(pctx, {
    data: {
      labels: perfData.labels,
      datasets: [
        { 
          type: 'bar', 
          label: 'Avg Compensation', 
          data: perfData.avgComp, 
          backgroundColor: chartStyles.colors[0],
          borderRadius: chartStyles.bar.borderRadius,
          maxBarThickness: chartStyles.bar.maxBarThickness
        },
        { 
          type: 'line', 
          label: 'Headcount', 
          data: perfData.headcount, 
          yAxisID: 'countAxis',
          ...chartStyles.line
        }
      ]
    },
    options: {
      ...baseOptions,
      scales: { 
        y: { 
          ...baseOptions.scales.y,
          position: 'left', 
          title: { display: true, text: 'Avg Compensation', font: { size: 12 } } 
        }, 
        countAxis: { 
          ...baseOptions.scales.y,
          position: 'right', 
          title: { display: true, text: 'Headcount', font: { size: 12 } }, 
          grid: { drawOnChartArea: false } 
        } 
      }
    }
  });
});

watch([chartType, selectedMetric, selectedDimension], renderMainChart);
</script>

<style scoped>
select { border: 1px solid #d1d5db; border-radius: 0.25rem; }
</style>
