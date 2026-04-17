const { execSync } = require('child_process');
const fs = require('hexo-fs');
const path = require('path');
const hexoLog = require('hexo-log');

const log = typeof hexoLog.default === 'function'
  ? hexoLog.default({ debug: false, silent: false })
  : hexoLog({ debug: false, silent: false });

const counts = (arr, value) => arr.reduce((total, item) => (item === value ? total + 1 : total), 0);

hexo.extend.helper.register('calendar', function (options) {
  return generateChart(options);
});

hexo.extend.tag.register('calendar', function (args, content) {
  return generateChart(JSON.parse(content));
}, { ends: true });

hexo.extend.console.register('gc', 'Generate calendar.json', function (args) {
  const date = new Date();
  const formattedDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
  const commitData = getCommitData(args.w);

  commitData[formattedDate] = commitData[formattedDate] ? (commitData[formattedDate] + 1) : 1;

  const dataDir = path.join(this.source_dir, '_data');
  if (!fs.existsSync(dataDir)) {
    log.info('Create dir ' + dataDir);
    fs.mkdirsSync(dataDir);
  }

  fs.writeFile(path.join(dataDir, 'calendar.json'), JSON.stringify(commitData), err => {
    if (err) {
      log.info('Failed to write data to calendar.json');
      console.error(err);
      return;
    }

    log.info('calendar.json has been saved');
  });
});

function generateChart(options = {}) {
  const defaultOptions = {
    width: '100%',
    height: '220px',
    id: 'calendar',
    monthLang: 'en',
    dayLang: 'en',
    weeks: 40,
    title: 'Calendar',
    insertScript: true,
    color: {
      background: '#f9f9f9',
      tooltip: {
        background: '#555',
        border: '#777'
      },
      visualMap: {
        inRange: '["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127"]'
      },
      calendar: {
        name: '#3C4858',
        itemBorder: '#fff',
        monthLabel: '#3C4858',
        dayLabel: '#3C4858'
      }
    }
  };

  const mergedOptions = Object.assign({}, defaultOptions, options);
  mergedOptions.color = Object.assign({}, defaultOptions.color, options.color || {});
  mergedOptions.color.tooltip = Object.assign({}, defaultOptions.color.tooltip, (options.color || {}).tooltip || {});
  mergedOptions.color.visualMap = Object.assign({}, defaultOptions.color.visualMap, (options.color || {}).visualMap || {});
  mergedOptions.color.calendar = Object.assign({}, defaultOptions.color.calendar, (options.color || {}).calendar || {});

  const { width, height, id, monthLang, dayLang, weeks, title, insertScript, color } = mergedOptions;

  let commitData = '{}';
  const calendarDataPath = path.join(hexo.source_dir, '_data', 'calendar.json');

  if (fs.existsSync(calendarDataPath)) {
    commitData = fs.readFileSync(calendarDataPath).toString();
  } else {
    commitData = JSON.stringify(getCommitData(weeks));
  }

  return `
<div id="${id}_box" style="width:100%;overflow-x:auto;overflow-y:hidden;">
  <div id="${id}" style="width:${width};height:${height};"></div>
</div>
${insertScript ? '<script data-pjax src="https://cdn.jsdelivr.net/npm/echarts@4.8.0/dist/echarts.min.js"></script>' : ''}
<script type="text/javascript" data-pjax>
  (function () {
    function dateFormat(date) {
      date = new Date(date);
      return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    function centerCalendar(box, child) {
      if (!box || !child) return;
      box.scrollLeft = Math.max((child.scrollWidth - box.clientWidth) / 2, 0);
    }

    var root = document.getElementById('${id}');
    var box = document.getElementById('${id}_box');

    if (!root || typeof echarts === 'undefined') return;

    var existingChart = echarts.getInstanceByDom(root);
    if (existingChart) {
      existingChart.dispose();
    }

    var calendarChart = echarts.init(root);
    var endDate = new Date().getTime();
    var startDate = new Date(endDate - ${weeks} * 7 * 24 * 3600 * 1000).getTime();
    var startDay = Math.ceil(startDate / (24 * 3600 * 1000));
    var endDay = Math.ceil(endDate / (24 * 3600 * 1000));
    var commitData = ${commitData};
    var seriesData = [];

    for (var i = startDay; i <= endDay; i++) {
      var date = i * 24 * 3600 * 1000;
      var formattedDate = dateFormat(date);
      var times = commitData[formattedDate] || 0;
      seriesData.push([formattedDate, times]);
    }

    var option = {
      title: {
        text: ${JSON.stringify(title)},
        x: 'center'
      },
      backgroundColor: ${JSON.stringify(color.background)},
      tooltip: {
        padding: 10,
        backgroundColor: ${JSON.stringify(color.tooltip.background)},
        borderColor: ${JSON.stringify(color.tooltip.border)},
        borderWidth: 1,
        formatter: function (params) {
          var value = params.value;
          return '<div style="font-size: 14px;">' + value[0] + ': ' + value[1] + '</div>';
        }
      },
      visualMap: {
        show: false,
        showLabel: true,
        min: 0,
        max: 4,
        calculable: false,
        inRange: {
          symbol: 'rect',
          color: ${color.visualMap.inRange}
        },
        itemWidth: 12,
        itemHeight: 12,
        orient: 'horizontal',
        left: 'center',
        top: 0
      },
      calendar: [{
        top: 50,
        left: 'center',
        range: [dateFormat(startDate), dateFormat(endDate)],
        cellSize: [13, 13],
        splitLine: {
          show: false
        },
        name: {
          textStyle: {
            color: ${JSON.stringify(color.calendar.name)}
          }
        },
        itemStyle: {
          borderColor: ${JSON.stringify(color.calendar.itemBorder)},
          borderWidth: 2
        },
        yearLabel: {
          show: false
        },
        monthLabel: {
          nameMap: ${typeof monthLang === 'string' ? JSON.stringify(monthLang) : JSON.stringify(monthLang)},
          fontSize: 11,
          color: ${JSON.stringify(color.calendar.monthLabel)}
        },
        dayLabel: {
          formatter: '{start} 1st',
          nameMap: ${typeof dayLang === 'string' ? JSON.stringify(dayLang) : JSON.stringify(dayLang)},
          fontSize: 11,
          color: ${JSON.stringify(color.calendar.dayLabel)}
        }
      }],
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        calendarIndex: 0,
        data: seriesData
      }]
    };

    calendarChart.setOption(option);
    requestAnimationFrame(function () {
      centerCalendar(box, root);
      calendarChart.resize();
    });
  })();
</script>
`;
}

function getCommitData(weeks = '40') {
  const gitLog = execSync(`git log --since="${weeks}.weeks" --date=iso --pretty=format:"%ad"`).toString();
  const gitLogData = gitLog.split('\n').filter(Boolean).map(item => item.split(' ')[0]);
  const uniqueDates = [...new Set(gitLogData)];
  const commitData = {};

  for (const date of uniqueDates) {
    commitData[date] = counts(gitLogData, date);
  }

  return commitData;
}
