class Wordcloud {
  constructor(_config, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      colorScale: _config.colorScale,
      containerWidth: _config.containerWidth || 260,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 25, right: 20, bottom: 20, left: 40},
    }
    this.data = _data;
    this.initVis();
  }
initVis(){
        // List of words
let vis=this;
var myWords = vis.data.map(function(d) {
  return d.description;
});
function getWordsByFrequency(texts) {
  // Define the list of words to exclude
  const excludedWords = ["the", "in", "a", "and", "of", "to", "i", "at", "it"];

  // Object to store word frequencies
  const wordFreq = {};

  // Register each text and count word occurrences
  texts.forEach(text => {
      const words = text.toLowerCase().split(/\W+/);
      words.forEach(word => {
          if (word !== "" && !excludedWords.includes(word)) { // Check if the word is not in the excluded list
              if (wordFreq[word]) {
                  wordFreq[word]++;
              } else {
                  wordFreq[word] = 1;
              }
          }
      });
  });

  // Convert object to array of {text, size} objects
  const wordFreqArray = Object.keys(wordFreq).map(word => ({ text: word, size: wordFreq[word] }));

  // Sort by frequency (descending)
  wordFreqArray.sort((a, b) => b.size - a.size);

  // Calculate the sum of the top sizes
  let sumOfTopSizes = 0;
  let numWrds =35;
  for (let i = 0; i < Math.min(wordFreqArray.length, numWrds); i++) {
      sumOfTopSizes += wordFreqArray[i].size;
  }

  // Update sizes with percentage of the sum
  for (let i = 0; i < Math.min(wordFreqArray.length, numWrds); i++) {
      wordFreqArray[i].size = (wordFreqArray[i].size / sumOfTopSizes) * 1000;
  }

  return wordFreqArray.slice(0, numWrds);

}

var wrdCloudArray = getWordsByFrequency(myWords);
console.log(wrdCloudArray);
// set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 450 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#ufo-wordcloud").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
// Wordcloud features that are different from one word to the other must be here
var layout = d3.layout.cloud()
  .size([width, height])
  .words(wrdCloudArray.map(function(d) { return {text: d.text, size:d.size}; }))
  .padding(5)        //space between words
  .rotate(function() { return ~~(Math.random() * 2) * 90; })
  .fontSize(function(d) { return d.size; })      // font size of words
  .on("end", draw);
layout.start();

// This function takes the output of 'layout' above and draw the words
// Wordcloud features that are THE SAME from one word to the other can be here
function draw(words) {
  svg
    .append("g")
      .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size; })
        .style("fill", "#69b3a2")
        .attr("text-anchor", "middle")
        .style("font-family", "Impact")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}
    }
}