$(document).ready(function() {
  const options = {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  }
  // Initialize all div with carousel class
  const carousels = bulmaCarousel.attach('.carousel', options);

})

document.addEventListener('DOMContentLoaded', function() {
  loadTableData();
  setupEventListeners();
  window.addEventListener('resize', adjustNameColumnWidth);
});

function loadTableData() {
      console.log('Starting to load StarEmbed table data...');

      fetch('./leaderboard_data.json')
        .then(response => {
          console.log('Response status:', response.status);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('StarEmbed data loaded successfully:', data);
          
          // Load both tables
          loadClusteringTable(data.leaderboardData);
          loadClassificationTable(data.leaderboardData);
          
          // Initialize sorting and adjust column widths
          initializeSorting();
          adjustNameColumnWidth();
        })
        .catch(error => {
          console.error('Error loading StarEmbed data:', error);
          const clusteringTbody = document.querySelector('#clustering-table tbody');
          const classificationTbody = document.querySelector('#classification-table tbody');
          
          if (clusteringTbody) {
            clusteringTbody.innerHTML = `
              <tr>
                <td colspan="9">Error loading data: ${error.message}</td>
              </tr>
            `;
          }
          
          if (classificationTbody) {
            classificationTbody.innerHTML = `
              <tr>
                <td colspan="19">Error loading data: ${error.message}</td>
              </tr>
            `;
          }
        });
  }

  function loadClusteringTable(models) {
    const tbody = document.querySelector('#clustering-table tbody');
    if (!tbody) return;

    // Prepare data for styling
    const clusteringScores = prepareClusteringScores(models);

    tbody.innerHTML = models.map((model, index) => {
      const nameCell = getModelNameCell(model);

      return `
        <tr class="${model.info.type}">
          <td style="text-align: left;">${nameCell}</td>
          <td>${model.info.size || '-'}</td>
          <td>${model.info.date || '-'}</td>
          <td>${applyStyle(model.clustering.kmeans.nmi, clusteringScores.kmeans_nmi[index])}</td>
          <td>${applyStyle(model.clustering.kmeans.ari, clusteringScores.kmeans_ari[index])}</td>
          <td>${applyStyle(model.clustering.kmeans.f1, clusteringScores.kmeans_f1[index])}</td>
          <td>${applyStyle(model.clustering.ward.nmi, clusteringScores.ward_nmi[index])}</td>
          <td>${applyStyle(model.clustering.ward.ari, clusteringScores.ward_ari[index])}</td>
          <td>${applyStyle(model.clustering.ward.f1, clusteringScores.ward_f1[index])}</td>
        </tr>
      `;
    }).join('');
  }

  function loadClassificationTable(models) {
    const tbody = document.querySelector('#classification-table tbody');
    if (!tbody) return;

    // Prepare data for styling
    const classificationScores = prepareClassificationScores(models);

    tbody.innerHTML = models.map((model, index) => {
      const nameCell = getModelNameCell(model);

      return `
        <tr class="${model.info.type}">
          <td style="text-align: left;">${nameCell}</td>
          <td>${model.info.size || '-'}</td>
          <td>${model.info.date || '-'}</td>
          <td>${applyStyle(model.classification.mlp.accuracy, classificationScores.mlp_accuracy[index])}</td>
          <td>${applyStyle(model.classification.mlp.recall, classificationScores.mlp_recall[index])}</td>
          <td>${applyStyle(model.classification.mlp.precision, classificationScores.mlp_precision[index])}</td>
          <td>${applyStyle(model.classification.mlp.f1, classificationScores.mlp_f1[index])}</td>
          <td>${applyStyle(model.classification.knn.accuracy, classificationScores.knn_accuracy[index])}</td>
          <td>${applyStyle(model.classification.knn.recall, classificationScores.knn_recall[index])}</td>
          <td>${applyStyle(model.classification.knn.precision, classificationScores.knn_precision[index])}</td>
          <td>${applyStyle(model.classification.knn.f1, classificationScores.knn_f1[index])}</td>
          <td>${applyStyle(model.classification.logistic.accuracy, classificationScores.logistic_accuracy[index])}</td>
          <td>${applyStyle(model.classification.logistic.recall, classificationScores.logistic_recall[index])}</td>
          <td>${applyStyle(model.classification.logistic.precision, classificationScores.logistic_precision[index])}</td>
          <td>${applyStyle(model.classification.logistic.f1, classificationScores.logistic_f1[index])}</td>
          <td>${applyStyle(model.classification.rf.accuracy, classificationScores.rf_accuracy[index])}</td>
          <td>${applyStyle(model.classification.rf.recall, classificationScores.rf_recall[index])}</td>
          <td>${applyStyle(model.classification.rf.precision, classificationScores.rf_precision[index])}</td>
          <td>${applyStyle(model.classification.rf.f1, classificationScores.rf_f1[index])}</td>
        </tr>
      `;
    }).join('');
  }

  function prepareClusteringScores(data) {
    const scores = {};
    const metrics = ['kmeans_nmi', 'kmeans_ari', 'kmeans_f1', 'ward_nmi', 'ward_ari', 'ward_f1'];
    
    metrics.forEach(metric => {
      const [method, metricName] = metric.split('_');
      const values = data.map(row => {
        const value = row.clustering[method][metricName];
        return value === '' ? null : parseFloat(value);
      }).filter(v => v !== null);
      
      if (values.length > 0) {
        const sortedValues = [...new Set(values)].sort((a, b) => b - a);
        scores[metric] = data.map(row => {
          const value = row.clustering[method][metricName];
          if (value === '' || value === null) return -1;
          return sortedValues.indexOf(parseFloat(value));
        });
      } else {
        scores[metric] = data.map(() => -1);
      }
    });
    
    return scores;
  }

  function prepareClassificationScores(data) {
    const scores = {};
    const metrics = ['mlp_accuracy', 'mlp_recall', 'mlp_precision', 'mlp_f1', 
                   'knn_accuracy', 'knn_recall', 'knn_precision', 'knn_f1',
                   'logistic_accuracy', 'logistic_recall', 'logistic_precision', 'logistic_f1',
                   'rf_accuracy', 'rf_recall', 'rf_precision', 'rf_f1'];
    
    metrics.forEach(metric => {
      const [method, metricName] = metric.split('_');
      const values = data.map(row => {
        const value = row.classification[method][metricName];
        return value === '' ? null : parseFloat(value);
      }).filter(v => v !== null);
      
      if (values.length > 0) {
        const sortedValues = [...new Set(values)].sort((a, b) => b - a);
        scores[metric] = data.map(row => {
          const value = row.classification[method][metricName];
          if (value === '' || value === null) return -1;
          return sortedValues.indexOf(parseFloat(value));
        });
      } else {
        scores[metric] = data.map(() => -1);
      }
    });
    
    return scores;
  }

  function getModelNameCell(model) {
    // Map model names to their corresponding model card paths
    const modelCardMap = {
      'Hand-crafted Features': 'static/model_card/hand-crafted-features/',
      'Chronos-tiny': 'static/model_card/chronos/',
      'Chronos-Bolt-tiny': 'static/model_card/chronos-bolt-tiny/',
      'Moirai-small': 'static/model_card/moirai-small/',
      'Astromer-1': 'static/model_card/astromer-1/',
      'Astromer-2': 'static/model_card/astromer-2/',
      'Random Embeddings': 'static/model_card/random-embeddings/'
    };

    const modelCardPath = modelCardMap[model.info.name];
    
    if (modelCardPath) {
      return `<a href="${modelCardPath}" target="_blank"><b>${model.info.name}</b></a>`;
    } else {
      // Fallback to original link if available, otherwise just bold text
      return model.info.link && model.info.link.trim() !== '' ?
        `<a href="${model.info.link}" target="_blank"><b>${model.info.name}</b></a>` :
        `<b>${model.info.name}</b>`;
    }
  }

function setupEventListeners() {
  // Reset button functionality for both tables
  document.querySelectorAll('.reset-cell').forEach(resetCell => {
    resetCell.addEventListener('click', function() {
      resetTable();
    });
  });

  // Sorting functionality for clustering table
  var clusteringHeaders = document.querySelectorAll('#clustering-table thead tr:last-child th.sortable');
  clusteringHeaders.forEach(function(header) {
    header.addEventListener('click', function() {
      sortTable(this);
    });
  });

  // Sorting functionality for classification table
  var classificationHeaders = document.querySelectorAll('#classification-table thead tr:last-child th.sortable');
  classificationHeaders.forEach(function(header) {
    header.addEventListener('click', function() {
      sortTable(this);
    });
  });
}

function toggleDetails(section) {
  var sections = ['pro', 'val', 'test'];
  sections.forEach(function(sec) {
    var detailCells = document.querySelectorAll('.' + sec + '-details');
    var overallCells = document.querySelectorAll('.' + sec + '-overall');
    var headerCell = document.querySelector('.' + sec + '-details-cell');
    if (sec === section) {
      detailCells.forEach(cell => cell.classList.toggle('hidden'));
      headerCell.setAttribute('colspan', headerCell.getAttribute('colspan') === '1' ? (sec === 'pro' ? '3' : '7') : '1');
    } else {
      detailCells.forEach(cell => cell.classList.add('hidden'));
      overallCells.forEach(cell => cell.classList.remove('hidden'));
      headerCell.setAttribute('colspan', '1');
    }
  });

  setTimeout(adjustNameColumnWidth, 0);
}

function resetTable() {
  // Reset sorting to default for both tables
  var kmeansNmiHeader = document.querySelector('#clustering-table thead tr:last-child th[data-metric="kmeans_nmi"]');
  if (kmeansNmiHeader) {
    sortTable(kmeansNmiHeader, true);
  }
  
  var mlpF1Header = document.querySelector('#classification-table thead tr:last-child th[data-metric="mlp_f1"]');
  if (mlpF1Header) {
    sortTable(mlpF1Header, true);
  }

  setTimeout(adjustNameColumnWidth, 0);
}

function sortTable(header, forceDescending = false, maintainOrder = false) {
  var table = header.closest('table');
  var tbody = table.querySelector('tbody');
  var rows = Array.from(tbody.querySelectorAll('tr'));
  var headers = Array.from(header.parentNode.children);
  var columnIndex = headers.indexOf(header);
  var sortType = header.dataset.sort;

  var isDescending = forceDescending || (!header.classList.contains('asc') && !header.classList.contains('desc')) || header.classList.contains('asc');

  if (!maintainOrder) {
    rows.sort(function(a, b) {
      var aValue = getCellValue(a, columnIndex);
      var bValue = getCellValue(b, columnIndex);

      if (aValue === '-' && bValue !== '-') return isDescending ? 1 : -1;
      if (bValue === '-' && aValue !== '-') return isDescending ? -1 : 1;

      if (sortType === 'number') {
        return isDescending ? parseFloat(bValue) - parseFloat(aValue) : parseFloat(aValue) - parseFloat(bValue);
      } else if (sortType === 'date') {
        return isDescending ? new Date(bValue) - new Date(aValue) : new Date(aValue) - new Date(bValue);
      } else {
        return isDescending ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      }
    });
  }

  headers.forEach(function(th) {
    th.classList.remove('asc', 'desc');
  });

  header.classList.add(isDescending ? 'desc' : 'asc');

  rows.forEach(function(row) {
    tbody.appendChild(row);
  });

  setTimeout(adjustNameColumnWidth, 0);
}

function getCellValue(row, index) {
  var cells = Array.from(row.children);
  var cell = cells[index];

  if (cell.classList.contains('hidden')) {
    if (cell.classList.contains('pro-details') || cell.classList.contains('pro-overall')) {
      cell = cells.find(c => (c.classList.contains('pro-overall') || c.classList.contains('pro-details')) && !c.classList.contains('hidden'));
    } else if (cell.classList.contains('val-details') || cell.classList.contains('val-overall')) {
      cell = cells.find(c => (c.classList.contains('val-overall') || c.classList.contains('val-details')) && !c.classList.contains('hidden'));
    } else if (cell.classList.contains('test-details') || cell.classList.contains('test-overall')) {
      cell = cells.find(c => (c.classList.contains('test-overall') || c.classList.contains('test-details')) && !c.classList.contains('hidden'));
    }
  }
  return cell ? cell.textContent.trim() : '';
}

function initializeSorting() {
  var kmeansNmiHeader = document.querySelector('#clustering-table thead tr:last-child th[data-metric="kmeans_nmi"]');
  if (kmeansNmiHeader) {
    sortTable(kmeansNmiHeader, true);
  }
  
  var mlpF1Header = document.querySelector('#classification-table thead tr:last-child th[data-metric="mlp_f1"]');
  if (mlpF1Header) {
    sortTable(mlpF1Header, true);
  }
}

function adjustNameColumnWidth() {
  const nameColumn = document.querySelectorAll('#clustering-table td:first-child, #clustering-table th:first-child, #classification-table td:first-child, #classification-table th:first-child');
  let maxWidth = 0;

  const span = document.createElement('span');
  span.style.visibility = 'hidden';
  span.style.position = 'absolute';
  span.style.whiteSpace = 'nowrap';
  document.body.appendChild(span);

  nameColumn.forEach(cell => {
    span.textContent = cell.textContent;
    const width = span.offsetWidth;
    if (width > maxWidth) {
      maxWidth = width;
    }
  });

  document.body.removeChild(span);

  maxWidth += 20; // Increased padding

  nameColumn.forEach(cell => {
    cell.style.width = `${maxWidth}px`;
    cell.style.minWidth = `${maxWidth}px`; // Added minWidth
    cell.style.maxWidth = `${maxWidth}px`;
  });
}

function prepareScoresForStyling(data, section) {
  const scores = {};
  const fields = [
    'overall', 'vision', 'original', 'artDesign', 'business',
    'science', 'healthMedicine', 'humanSocialSci', 'techEng'
  ];

  fields.forEach(field => {
    const values = data.map(row => row[section] && row[section][field])
                       .filter(value => value !== '-' && value !== undefined && value !== null)
                       .map(parseFloat);

    if (values.length > 0) {
      const sortedValues = [...new Set(values)].sort((a, b) => b - a);
      scores[field] = data.map(row => {
        const value = row[section] && row[section][field];
        if (value === '-' || value === undefined || value === null) {
          return -1;
        }
        return sortedValues.indexOf(parseFloat(value));
      });
    } else {
      scores[field] = data.map(() => -1);
    }
  });

  return scores;
}

function applyStyle(value, rank) {
      if (value === undefined || value === null || value === '-') return '-';
      if (rank === 0) return `<b>${value}</b>`;
      if (rank === 1) return `<span style="text-decoration: underline;">${value}</span>`;
      return value;
    }

document.addEventListener('DOMContentLoaded', function() {
    // Data for the "Diagrams" chart
    const data_Diagrams = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [27.6, 30.1, 31.8, 30.0, 32.0, 38.5, 40.8, 44.6, 42.8, 46.8],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };

    // "data_Diagrams" chart
    new Chart(document.getElementById('chart_Diagrams'), {
        type: 'bar',
        data: data_Diagrams,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Tables" chart
    const data_Tables  = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [26.6, 29.0, 29.8, 27.8, 27.8, 33.6, 40.2, 37.8, 39.9, 61.8],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Tables'), {
        type: 'bar',
        data: data_Tables,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_PlotsAndCharts " chart
    const data_PlotsAndCharts   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [24.8, 31.8, 36.2, 30.4, 35.8, 43.6, 44.9, 44.3, 47.6, 55.6],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_PlotsAndCharts'), {
        type: 'bar',
        data: data_PlotsAndCharts ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Photographs " chart
    const data_Photographs   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [27.6, 40.5, 41.4, 44.4, 42.0, 51.9, 57.3, 58.4, 60.9, 64.2],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Photographs'), {
        type: 'bar',
        data: data_Photographs ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_ChemicalStructures " chart
    const data_ChemicalStructures   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [25.0, 27.2, 27.1, 26.7, 25.5, 30.4, 32.5, 35.6, 38.7, 50.6],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_ChemicalStructures'), {
        type: 'bar',
        data: data_ChemicalStructures ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Paintings " chart
    const data_Paintings   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [28.7, 57.2, 53.6, 56.3, 52.1, 67.3, 68.9, 73.1, 71.7, 75.9],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Paintings'), {
        type: 'bar',
        data: data_Paintings ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_GeometricShapes " chart
    const data_GeometricShapes   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [21.1, 25.3, 21.4, 25.6, 28.3, 31, 33.9, 35.7, 37.8, 40.2],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_GeometricShapes'), {
        type: 'bar',
        data: data_GeometricShapes ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_SheetMusic " chart
    const data_SheetMusic   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [35.2, 33.4, 34.6, 35.8, 34.9, 37.3, 33.1, 39.4, 37.6, 38.8],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_SheetMusic'), {
        type: 'bar',
        data: data_SheetMusic ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_MedicalImages " chart
    const data_MedicalImages   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [25.4, 29.8, 31.6, 36.4, 29.8, 47.8, 50.7, 52.6, 51.8, 59.6],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_MedicalImages'), {
        type: 'bar',
        data: data_MedicalImages ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_PathologicalImages " chart
    const data_PathologicalImages   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [26.5, 27.7, 31.2, 35.2, 35.6, 50.2, 57.3, 56.1, 52.6, 63.6],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_PathologicalImages'), {
        type: 'bar',
        data: data_PathologicalImages ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_MicroscopicImages " chart
    const data_MicroscopicImages   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [27.0, 37.6, 29.2, 36.3, 32.7, 49.1, 54.9, 50.4, 56.6, 58.0],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_MicroscopicImages'), {
        type: 'bar',
        data: data_MicroscopicImages ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_MRIsCTScansXrays " chart
    const data_MRIsCTScansXrays   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [21.7, 36.9, 33.3, 39.4, 29.8, 44.9, 51.5, 48, 48.5, 50.0],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_MRIsCTScansXrays'), {
        type: 'bar',
        data: data_MRIsCTScansXrays ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_SketchesAndDrafts " chart
    const data_SketchesAndDrafts   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [37.0, 32.1, 29.9, 38.0, 33.7, 45.7, 45.7, 48.9, 52.7, 55.4],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_SketchesAndDrafts'), {
        type: 'bar',
        data: data_SketchesAndDrafts ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Maps " chart
    const data_Maps   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [38.2, 36.5, 45.9, 47.6, 43.5, 52.4, 58.2, 58.2, 62.4, 61.8],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Maps'), {
        type: 'bar',
        data: data_Maps ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_TechnicalBlueprints " chart
    const data_TechnicalBlueprints   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [24.7, 25.9, 28.4, 25.3, 27.8, 30.9, 37.7, 40.1, 36.4, 38.9],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_TechnicalBlueprints'), {
        type: 'bar',
        data: data_TechnicalBlueprints ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_TreesAndGraphs " chart
    const data_TreesAndGraphs   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [30.1, 28.1, 28.8, 28.8, 34.9, 43.2, 33.6, 37, 41.1, 50.0],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_TreesAndGraphs'), {
        type: 'bar',
        data: data_TreesAndGraphs ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_MathematicalNotations " chart
    const data_MathematicalNotations   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [15.8, 27.1, 22.6, 21.8, 21.1, 30.8, 33.8, 36.8, 34.6, 45.9],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_MathematicalNotations'), {
        type: 'bar',
        data: data_MathematicalNotations ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_ComicsAndCartoons " chart
    const data_ComicsAndCartoons   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [29.0, 51.9, 49.6, 54.2, 51.1, 64.9, 63.4, 71, 74.8, 68.7],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_ComicsAndCartoons'), {
        type: 'bar',
        data: data_ComicsAndCartoons ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Sculpture " chart
    const data_Sculpture   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [30.8, 46.2, 49.6, 51.3, 53.0, 65.8, 69.2, 76.9, 71.8, 76.1],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Sculpture'), {
        type: 'bar',
        data: data_Sculpture ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Portraits " chart
    const data_Portraits   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [20.9, 52.7, 46.2, 54.9, 47.3, 62.6, 62.6, 67, 70.3, 70.3],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Portraits'), {
        type: 'bar',
        data: data_Portraits ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Screenshots " chart
    const data_Screenshots   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [38.6, 35.7, 38.6, 34.3, 47.1, 52.9, 60, 51.4, 57.1, 65.7],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Screenshots'), {
        type: 'bar',
        data: data_Screenshots ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Other " chart
    const data_Other   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [28.3, 38.3, 50.0, 51.7, 58.3, 60, 61.7, 60, 68.3, 68.3],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Other'), {
        type: 'bar',
        data: data_Other ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Poster " chart
    const data_Poster   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [38.6, 50.9, 52.6, 61.4, 64.9, 66.7, 68.4, 71.9, 75.4, 80.7],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Poster'), {
        type: 'bar',
        data: data_Poster ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_IconsAndSymbols " chart
    const data_IconsAndSymbols   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [23.8, 66.7, 57.1, 59.5, 59.5, 73.8, 73.8, 76.2, 81, 78.6],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_IconsAndSymbols'), {
        type: 'bar',
        data: data_IconsAndSymbols ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_HistoricalTimelines " chart
    const data_HistoricalTimelines   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [30.0, 36.7, 40.0, 43.3, 43.3, 50, 66.7, 63.3, 63.3, 63.3],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_HistoricalTimelines'), {
        type: 'bar',
        data: data_HistoricalTimelines ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_3DRenderings " chart
    const data_3DRenderings   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [33.3, 28.6, 57.1, 38.1, 47.6, 42.9, 42.9, 57.1, 42.9, 47.6],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_3DRenderings'), {
        type: 'bar',
        data: data_3DRenderings ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_DNASequences " chart
    const data_DNASequences   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [20.0, 45.0, 25.0, 25.0, 45.0, 45, 30, 30, 30, 55.0],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_DNASequences'), {
        type: 'bar',
        data: data_DNASequences ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Landscapes " chart
    const data_Landscapes   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [43.8, 43.8, 50.0, 31.2, 62.5, 50, 68.8, 62.5, 68.8, 68.8],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Landscapes'), {
        type: 'bar',
        data: data_Landscapes ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_LogosAndBranding " chart
    const data_LogosAndBranding   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [21.4, 57.1, 64.3, 35.7, 50.0, 57.1, 78.6, 78.6, 71.4, 85.7],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_LogosAndBranding'), {
        type: 'bar',
        data: data_LogosAndBranding ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });

    // "data_Advertisements " chart
    const data_Advertisements   = {
        labels: ['Adept Fuyu-8B', 'Qwen-VL-7B-Chat', 'InstructBLIP-T5-XXL', 'LLaVA-1.5-13B', 'BLIP-2 FLAN-T5-XXL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V'],
        datasets: [{
            data: [30.0, 60.0, 50.0, 60.0, 70.0, 80, 70, 80, 80, 100.0],
            backgroundColor: ['rgba(196, 123, 160, 0.6)', 'rgba(245, 123, 113, 0.6)', 'rgba(255, 208, 80, 0.6)', 'rgba(110, 194, 134, 0.6)', 'rgba(255, 153, 78, 0.6)', 'rgba(42, 149, 235, 0.6)','rgba(183, 156, 220, 0.6)' ,'rgba(143, 169, 209, 0.6)' ,'rgba(72, 199, 176, 0.6)' ,'rgba(117, 209, 215, 0.6)'],
            borderColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,0.4)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' ,  'rgba(117, 209, 215, 1)'],
            hoverBackgroundColor: ['rgba(196, 123, 160, 1)', 'rgba(245, 123, 113,1)', 'rgba(255, 208, 80, 1)', 'rgba(110, 194, 134, 1)', 'rgba(255, 153, 78, 1)', 'rgba(42, 149, 235, 1)','rgba(183, 156, 220, 1)' ,'rgba(143, 169, 209, 1)' ,'rgba(72, 199, 176, 1)' , 'rgba(117, 209, 215, 1)']
        }]
    };
    new Chart(document.getElementById('chart_Advertisements'), {
        type: 'bar',
        data: data_Advertisements ,
        options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20
            }
          },
          x: {
            display: false
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
          }
        }
      }
    });
});

document.addEventListener('DOMContentLoaded', function() {
  const canvas_image = document.getElementById('single_vs_multiple_chart');
  if (canvas_image) {
    canvas_image.style.width = '500px';
    canvas_image.style.height = '120px';
    const svm = canvas_image.getContext('2d');
    const single_vs_multiple_chart = new Chart(svm, {
      type: 'bar',
      data: {
        labels: ['InternLM-XComposer2-VL', 'Yi-VL-34B', 'LLaVA-1.6-34B', 'InternVL-Chat-V1.2', 'VILA1.5', 'GPT-4V(ision) (Playground)'],
        datasets: [{
          label: 'Single Image',
          data: [38.6, 42, 45.1, 46.9, 47, 56.1],
          backgroundColor: 'rgba(42, 149, 235, 0.6)',
          borderColor: 'rgba(42, 149, 235, 1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(42, 149, 235, 1)'
        },
        {
          label: 'Multiple Image',
          data: [34.5, 36.6, 40, 38.4, 45.9, 51.7],
          backgroundColor: 'rgba(255, 153, 78, 0.6)',
          borderColor: 'rgba(255, 153, 78, 1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(255, 153, 78, 1)'
        },
        {
          label: 'Overall',
          data: [38.2, 41.6, 44.7, 46.2, 46.9, 55.7],
          backgroundColor: 'rgba(110, 194, 134, 0.6)',
          borderColor: 'rgba(110, 194, 134, 1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(110, 194, 134, 1)'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 80,
            ticks: {
              stepSize: 20,
              font: {
                size: 16
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 16
              }
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 16
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y;
              }
            }
          }
        },
        onHover: (event, chartElement) => {
          event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
        }
      }
    });
  } else {
    console.error('Element with id "single_vs_multiple_chart" not found.');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('difficulty_level_chart');
  if (canvas) {
    canvas.style.width = '500px';
    canvas.style.height = '120px';
    const ctx = canvas.getContext('2d');
    const difficulty_level_chart = new Chart(ctx, {
      type: 'bar',
      data: {
      labels: ['Easy', 'Medium', 'Hard', 'Overall'],
      datasets: [{
        label: 'Adept Fuyu-8B',
        data: [28.9, 27, 26.4, 27.4],
        backgroundColor: 'rgba(196, 123, 160, 0.6)',
        borderColor: 'rgba(196, 123, 160, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(196, 123, 160, 1)'
      },
      {
        label: 'Qwen-VL-7B-Chat',
        data: [39.4, 31.9, 27.6, 32.9],
        backgroundColor: 'rgba(245, 123, 113, 0.6)',
        borderColor: 'rgba(245, 123, 113, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(245, 123, 113, 1)'
      },
      {
        label: 'LLaVA-1.5-13B',
        data: [41.3, 32.7, 26.7, 33.6],
        backgroundColor: 'rgba(255, 208, 80, 0.6)',
        borderColor: 'rgba(255, 208, 80, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(255, 208, 80, 1)'
      },
      {
        label: 'InstructBLIP-T5-XXL',
        data: [40.3, 32.3, 29.4, 33.8],
        backgroundColor: 'rgba(110, 194, 134, 0.6)',
        borderColor: 'rgba(110, 194, 134, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(110, 194, 134, 1)'
      },
      {
        label: 'BLIP-2 FLAN-T5-XXL',
        data: [41, 32.7, 28.5, 34],
        backgroundColor: 'rgba(255, 153, 78, 0.6)',
        borderColor: 'rgba(255, 153, 78, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(255, 153, 78, 1)'
      },
      {
        label: 'Yi-VL-34B',
        data: [51.0, 39.9, 34.0, 41.6],
        backgroundColor: 'rgba(42, 149, 235, 0.6)',
        borderColor: 'rgba(42, 149, 235, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(42, 149, 235, 1)'
      },
      {
        label: 'LLaVA-1.6-34B',
        data: [56.1, 43.4, 34.4, 44.7],
        backgroundColor: 'rgba(183, 156, 220, 0.6)',
        borderColor: 'rgba(183, 156, 220, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(183, 156, 220, 1)'
      },
      {
        label: 'InternVL-Chat-V1.2',
        data: [56.2, 44.8, 37.8, 46.2],
        backgroundColor: 'rgba(143, 169, 209, 0.6)',
        borderColor: 'rgba(143, 169, 209, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(143, 169, 209, 1)'
      },
      {
        label: 'VILA1.5',
        data: [58.1, 45.5, 36.8, 46.9],
        backgroundColor: 'rgba(172, 199, 176, 0.6)',
        borderColor: 'rgba(172, 199, 176, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(172, 199, 176, 1)'
      },
      {
        label: 'GPT-4V(ision) (Playground)',
        data: [76.1, 55.6, 31.2, 55.7],
        backgroundColor: 'rgba(117, 209, 215, 0.6)',
        borderColor: 'rgba(117, 209, 215, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(117, 209, 215, 1)'
      }]
    },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              font: {
                size: 16
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 16
              }
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              font: {
                size: 16
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y;
              }
            }
          }
        },
        onHover: (event, chartElement) => {
          event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
        }
      }
    });
  } else {
    console.error('Element with id "difficulty_level_chart" not found.');
  }
});