/**
 * Bar chart for NON-numerical data (e.g., categories)
 */

class BarChart {
  /**
   * Constructor for the BarChart
   */
  constructor(_parentElement, _data, _config) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.config = {
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      containerWidth: 1200,
      containerHeight: 500,
      ..._config,
    };
    this.initVis();
  }
}
