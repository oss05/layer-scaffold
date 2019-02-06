import * as d3 from 'd3';

/*
 * Simple Layer Chart
 */
export default function (config, chart) {
  
  // Link Layer to the helper object in helper.js
  var Layer = chart ? Object.create(chart) : {};

  Layer.init = function (config) {
    var vm = this;

    vm._config = config ? config : {};
    vm._data = [];
    vm._scales = {};
    vm._tip = vm.utils.d3.tip()
      .attr('class', 'd3-tip')
      .direction('n')
      .html(vm._config.tip || function (d) {
        var html = '';
        html += d[vm._config.x] ? ('<span>' + (Number.isNaN(+d[vm._config.x]) || vm._config.xAxis.scale === 'band' ? d[vm._config.x] : vm.utils.format(d[vm._config.x])) + '</span></br>') : '';
        html += d[vm._config.y] ? ('<span>' + (Number.isNaN(+d[vm._config.y]) || vm._config.yAxis.scale === 'band' ? d[vm._config.y] : vm.utils.format(d[vm._config.y])) + '</span></br>') : '';
        return html;
      });
  };


  //-------------------------------
  //User config functions
  Layer.id = function (columnName) {
    var vm = this;
    vm._config.id = columnName;
    return vm;
  };

  Layer.x = function (columnName) {
    var vm = this;
    vm._config.x = columnName;
    return vm;
  };

  Layer.y = function (columnName) {
    var vm = this;
    vm._config.y = columnName;
    return vm;
  };

  /**
   * column name used for the domain values
   * @param {string} columnName 
   */
  Layer.fill = function (columnName) {
    var vm = this;
    vm._config.fill = columnName;
    return vm;
  };


  Layer.format = function (format) {
    var vm = this;
    if (typeof format == 'function' || format instanceof Function) {
      vm.utils.format = format;
    } else {
      vm.utils.format = d3.format(format);
    }
    return vm;
  };

  Layer.tip = function (tip) {
    var vm = this;
    vm._config.tip = tip;
    return vm;
  };

  Layer.legend = function (legend) {
    var vm = this;
    vm._config.legend = legend;
    return vm;
  };


  //-------------------------------
  //
  Layer.data = function (data) {
    var vm = this;

    if (vm._config.filter) {
      //In case we want to filter observations
      data = data.filter(vm._config.filter);
    }

    vm._data = data.map(function (d) {
      if (d[vm._config.x] == Number(d[vm._config.x]))
        d[vm._config.x] = +d[vm._config.x];
      if (d[vm._config.y] == Number(d[vm._config.y]))
        d[vm._config.y] = +d[vm._config.y];
      return d;
    });

    //@TODO - ALLOW MULITPLE SORTS
    if (vm._config.sortBy) {
      vm._data = vm._data.sort(function (a, b) {
        return a[vm._config.sortBy[0]] - b[vm._config.sortBy[0]];
      });
    }

    if (vm._config.hasOwnProperty('quantiles')) {
      vm._quantiles = vm._setQuasecondntile(data);
      vm._minMax = d3.extent(data, function (d) {
        return +d[vm._config.fill];
      });
    }

    return vm;
  };

  Layer.scales = function () {
    var vm = this;
    var config;
    //vm._scales = scales;
    /* Use
     * vm._config.x
     * vm._config.xAxis.scale
     * vm._config.y
     * vm._config.yAxis.scale
     * vm._data
     */
    if (vm._config.hasOwnProperty('x') && vm._config.hasOwnProperty('y')) {
      config = {
        column: vm._config.x,
        type: vm._config.xAxis.scale,
        range: [0, vm.chart.width],
        minZero: vm._config.xAxis.minZero
      };
      if (vm._config.xAxis.domains) {
        config.domains = vm._config.xAxis.domains;
      }
      vm._scales.x = vm.utils.generateScale(vm._data, config);

      config = {
        column: vm._config.y,
        type: vm._config.yAxis.scale,
        range: [vm.chart.height, 0],
        minZero: vm._config.yAxis.minZero
      };
      if (vm._config.yAxis.domains) {
        config.domains = vm._config.yAxis.domains;
      }
      vm._scales.y = vm.utils.generateScale(vm._data, config);
    }

    if (vm._config.hasOwnProperty('colors'))
      vm._scales.color = d3.scaleOrdinal(vm._config.colors);
    else
      vm._scales.color = d3.scaleOrdinal(d3.schemeCategory10);

    return vm;
  };


  Layer.draw = function () {
    var vm = this;

    vm.chart.svg().call(vm._tip);

    vm.chart.svg().selectAll('.figure')
      .data(vm._data)
      .enter().append('rect')
      .attr('class', 'figure')
      .attr('id', function (d, i) {
        var id = 'figure-' + i;
        if (vm._config.id) {
          id = 'figure-' + d[vm._config.id];
        }
        return id;
      })
      .attr('x', function (d) {
        var value = vm._scales.x(d[vm._config.x]);
        if (vm._config.xAxis.scale == 'linear') {
          if (d[vm._config.x] > 0) {
            value = vm._scales.x(0);
          }
        }
        return value;
      })
      .attr('y', function (d) {
        var value =  vm._scales.y(d[vm._config.y]);
        if (vm._config.yAxis.scale === 'linear') {
          if (d[vm._config.y] < 0) { 
            value = vm._scales.y(0);
          }
        }
        return value;
      })
      .attr('width', function (d) {
        return vm._scales.x.bandwidth ? vm._scales.x.bandwidth() : Math.abs(vm._scales.x(d[vm._config.x]) - vm._scales.x(0));
      })
      .attr('height', function (d) {
        return vm._scales.y.bandwidth ? vm._scales.y.bandwidth() : Math.abs(vm._scales.y(d[vm._config.y]) - vm._scales.y(0));
      })
      .attr('fill', function (d) {
        return vm._scales.color !== false ? vm._scales.color(d[vm._config.fill]) : '#000';
      })
      .style('opacity', 0.9)
      .on('mouseover', function (d, i) {
        if (vm._config.hasOwnProperty('quantiles') && vm._config.quantiles.hasOwnProperty('colorsOnHover')) { //OnHover colors
          d3.select(this).attr('fill', function (d) {
            return vm._getQuantileColor(d[vm._config.fill], 'onHover');
          });
        }
        vm._tip.show(d, d3.select(this).node());

        if (vm._config.hasOwnProperty('onmouseover')) { //External function call, must be after all the internal code; allowing the user to overide 
          vm._config.onmouseover.call(this, d, i);
        }

      })
      .on('mouseout', function (d, i) {
        if (vm._config.hasOwnProperty('quantiles') && vm._config.quantiles.hasOwnProperty('colorsOnHover')) { //OnHover reset default color
          d3.select(this).attr('fill', function (d) {
            return '#000';
          });
        }
        vm._tip.hide();

        if (vm._config.hasOwnProperty('onmouseout')) { //External function call, must be after all the internal code; allowing the user to overide 
          vm._config.onmouseout.call(this, d, i);
        }
      })
      .on('click', function (d, i) {
        if (vm._config.hasOwnProperty('click')) {
          vm._config.onclick.call(this, d, i);
        }
      });

    return vm;
  };



  Layer.init(config);
  return Layer;
}
