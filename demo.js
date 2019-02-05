import * as d3 from 'd3';

/*
 * Simple Demo Chart
 */
export default function () {
  // Link Demo to the helper object in helper.js
  const Demo = {};

  Demo.config = function config() {
    const vm = this;

    vm.margin = {
      top: 20, right: 20, bottom: 30, left: 40,
    };
    vm.width = 960 - vm.margin.left - vm.margin.right;
    vm.height = 500 - vm.margin.top - vm.margin.bottom;

    vm.scales();
  };

  Demo.scales = function scales() {
    const vm = this;

    vm.x = d3.scaleBand()
      .range([0, vm.width])
      .padding(0.1);

    vm.y = d3.scaleLinear()
      .range([vm.height, 0]);
  };

  Demo.chart = function chart() {
    const vm = this;
    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const svg = d3.select('body').append('svg')
      .attr('width', vm.width + vm.margin.left + vm.margin.right)
      .attr('height', vm.height + vm.margin.top + vm.margin.bottom)
      .append('g')
      .attr('transform', `translate(${vm.margin.left}, ${vm.margin.top})`);

    return svg;
  };

  // User called
  Demo.data = function data(dat) {
    const vm = this;
    // format the data
    dat.forEach((d) => {
      d.y = +d.y;
    });

    vm._data = dat;

    // Scale the range of the data in the domains
    vm.x.domain(dat.map(d => d.x));
    vm.y.domain([0, d3.max(dat, d => d.y)]);

    return vm;
  };

  Demo.draw = function draw() {
    const vm = this;
    // append the rectangles for the bar chart
    const svg = vm.chart();

    svg.selectAll('.bar')
      .data(vm._data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => vm.x(d.x))
      .attr('width', vm.x.bandwidth())
      .attr('y', d => vm.y(d.y))
      .attr('height', d => vm.height - vm.y(d.y));

    // add the x Axis
    svg.append('g')
      .attr('transform', `translate(0,${vm.height})`)
      .call(d3.axisBottom(vm.x));

    // add the y Axis
    svg.append('g')
      .call(d3.axisLeft(vm.y));

    return vm;
  };

  Demo.config();

  return Demo;
}
