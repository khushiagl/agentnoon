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
        const row      = node.data.data;
        const kids     = node.children || [];
        const isLeaf   = kids.length === 0;

        // immediate/direct children count
        row.directCount = kids.length;

        if (isLeaf) {
          // no subordinates
          row.icCost          = row.Salary;
          row.managementCost  = 0;
          row.totalCost       = row.Salary;
          row.descendantCount = 0;
        } else {
          // sum IC cost from all children
          row.icCost = d3.sum(kids, c => c.data.data.icCost);

          // management cost = sum of (child salary if child is manager) + child's managementCost
          row.managementCost = d3.sum(kids, c => {
            const child = c.data.data;
            const childIsManager = (c.children && c.children.length > 0);
            return (childIsManager ? child.Salary : 0) + child.managementCost;
          });

          // total of both
          row.totalCost = row.icCost + row.managementCost;

          // total number of descendants
          row.descendantCount = d3.sum(kids, c =>
            c.data.data.descendantCount + 1
          );
        }
      });

      // 6) expose for components
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
