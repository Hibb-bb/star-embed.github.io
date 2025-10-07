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
