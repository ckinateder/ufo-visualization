class LineChart {
  constructor(_config, _data, attribute1, attribute2) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 900,
      containerHeight: _config.containerHeight || 500,
      margin: { top: 10, bottom: 30, right: 10, left: 30 },
    };

    this.attribute1 = attribute1;
    this.attribute2 = attribute2;
    this.data = _data;

    // Call a class function
    this.initVis();
  }
  initVis() {
    let vis = this;
    //set up the width and height of the area where visualizations will go- factoring in margins
    this.width =
      this.config.containerWidth -
      this.config.margin.left -
      this.config.margin.right;
    this.height =
      this.config.containerHeight -
      this.config.margin.top -
      this.config.margin.bottom;

    //reusable functions for x and y
    //if you reuse a function frequetly, you can define it as a parameter
    //also, maybe someday you will want the user to be able to re-set it.
    vis.xValue = (d) => d[vis.attribute1];
    vis.yValue = (d) => d[vis.attribute2];

    //setup scales
    vis.xScale = d3
      .scaleLinear()
      .domain(d3.extent(vis.data, vis.xValue)) //d3.min(vis.data, d => d[vis.attribute1]), d3.max(vis.data, d => d[vis.attribute1]) );
      .range([0, vis.width]);

    vis.yScale = d3
      .scaleLinear()
      .domain(d3.extent(vis.data, vis.yValue))
      .range([vis.height, 0])
      .nice(); //this just makes the y axes behave nicely by rounding up

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Create a group element to hold the line chart
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Add X axis --> it is a date format
    const x = d3
      .scaleTime()
      .domain(
        d3.extent(vis.data, function (d) {
          return d[vis.attribute1];
        })
      )
      .range([0, vis.width]);
    vis.svg
      .append("g")
      .attr("transform", `translate(0, ${vis.height})`)
      .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(vis.data, function (d) {
          return +d[vis.attribute2];
        }),
      ])
      .range([vis.height, 0]);

    vis.svg.append("g").call(d3.axisLeft(y));

    // Add the line
    vis.svg
      .append("path")
      .datum(vis.data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(d[vis.attribute1]);
          })
          .y(function (d) {
            return y(d[vis.attribute2]);
          })
      );
  }

  // //leave this empty for now...
  renderVis() {}
}
