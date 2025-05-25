// src/hooks/useOrgData.js
import { ref } from 'vue';
import * as d3 from 'd3';
import Papa from 'papaparse';

export function useOrgData() {
  const orgData   = ref(null);
  const isLoading = ref(false);

  function processCSV(csvText) {
    isLoading.value = true;
    try {
      // 1. parse CSV
      const { data, errors } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim(),
        transform:    v => v.trim(),
      });
      if (errors.length) {
        console.error(errors);
        throw new Error('CSV parse error');
      }

      // 2. build a stratified tree
      const stratify = d3.stratify()
        .id(d => d['Employee Id'])
        .parentId(d => d.Manager || null);
      const tree = stratify(data);

      // 3. wrap it in a d3.hierarchy so we can do bottom-up
      const root = d3.hierarchy(tree, d => d.children);

      // 4. convert salary to number
      root.each(node => {
        node.data.data.Salary = +node.data.data.Salary || 0;
      });

      // 5. bottom-up compute: icCost, managementCost, totalCost, descendantCount
      root.eachAfter(node => {
        const row = node.data.data;
        if (!node.children || !node.children.length) {
          // leaf
          row.icCost          = row.Salary;
          row.managementCost  = 0;
          row.totalCost       = row.Salary;
          row.descendantCount = 0;
        } else {
          // internal
          // sum of leaf-descendant salaries
          row.icCost = d3.sum(node.children, c => c.data.data.icCost);
          // sum of (child salary if child is a manager) + child's managementCost
          row.managementCost = d3.sum(node.children, c => {
            const childRow = c.data.data;
            const isManager = c.children && c.children.length > 0;
            return (isManager ? childRow.Salary : 0)
                 + childRow.managementCost;
          });
          row.totalCost = row.icCost + row.managementCost;
          // total number of descendants
          row.descendantCount = d3.sum(node.children, c =>
            c.data.data.descendantCount + 1
          );
        }
      });

      orgData.value = {
        root,
        totalEmployees: data.length,
        totalCost:      root.data.data.totalCost,
        managementCost: root.data.data.managementCost,
        icCost:         root.data.data.icCost,
      };
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return { orgData, processCSV, isLoading };
}
