// Data for line chart
const DATA = [
    { "Month": "1", "Value": "604595926" },
    { "Month": "2", "Value": "1267808665" },
    { "Month": "3", "Value": "480320921" },
    { "Month": "4", "Value": "582071797" },
    { "Month": "5", "Value": "300841190" },
    { "Month": "6", "Value": "481455629" },
    { "Month": "7", "Value": "741323289" },
    { "Month": "8", "Value": "565711826" },
    { "Month": "9", "Value": "1069374501" },
    { "Month": "10", "Value": "460602615" },
    { "Month": "11", "Value": "436770128" },
    { "Month": "12", "Value": "1563937936" },
    { "Month": "13", "Value": "751946678" },
    { "Month": "14", "Value": "2429903537" },
    { "Month": "15", "Value": "1024669786" },
    { "Month": "16", "Value": "919156162" },
    { "Month": "17", "Value": "715685109" },
    { "Month": "18", "Value": "883259190" },
    { "Month": "19", "Value": "1057197739" },
    { "Month": "20", "Value": "829002853" },
    { "Month": "21", "Value": "1877201351" },
    { "Month": "22", "Value": "1124226215" },
    { "Month": "23", "Value": "1406923469" },
    { "Month": "24", "Value": "1539324611" },
    { "Month": "25", "Value": "2210998702" },
    { "Month": "26", "Value": "5202358336" },
    { "Month": "27", "Value": "2142930036" },
    { "Month": "28", "Value": "1677523455" },
    { "Month": "29", "Value": "1487492711" },
    { "Month": "30", "Value": "1750779319" } 
];

const width = 800;
const height = 600;
const margin = ({top: 30, right: 60, bottom: 100, left: 100});
let startIndex = 0;
let endIndex = DATA.length - 1;
let deviationEl = document.getElementById("form_deviation");
deviationEl.addEventListener("change", () => {
    handleDeviation();
});

let svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const xMin = d3.min(DATA, d => +d.Month);
const xMax = d3.max(DATA, d => +d.Month);
const xScale = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, innerWidth]);

const yMin = d3.min(DATA, d => +d.Value);
const yMax = d3.max(DATA, d => +d.Value);
const yScale = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([innerHeight, 0]);


let rootGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Create x axis
let xAxis = rootGroup.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale));

xAxis.append("text")
    .attr("class", "axis-legend")
    .attr("x", innerWidth + 32)
    .attr("y", 0)
    .text("Month");

// Create y axis
let yAxis = rootGroup.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale));

yAxis.append("text")
    .attr("class", "axis-legend")
    .attr("x", margin.left)
    .attr("y", 0)
    .text("GMV in CNY");

// Create lines
const lineGenerator = d3.line()
    .x(d => xScale(+d.Month))
    .y(d => yScale(+d.Value));

const lineGroup = rootGroup.append("g")
    .attr("class", "line-group");

lineGroup.append("path")
    .datum(DATA)  
    .attr("class", "line") 
    .attr("d", lineGenerator);

// Create dots on lines
const dotGroup = rootGroup.append("g")
    .attr("class", "dot-group");

dotGroup.selectAll(".dot")
    .data(DATA)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScale(+d.Month))
    .attr("cy", d => yScale(+d.Value))
    .attr("r", 5);

// Create brush area
drawBrush();

/**
 * Draw brush area
 */
function drawBrush() {
    const brushHeight = 64;
    const brushYScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([brushHeight, 0]);

    const brush = d3.brushX()
        .extent([[0, 0], [innerWidth, brushHeight]])
        .on("brush end", brushed);

    const brushGroup = rootGroup.append("g")
        .attr("class", "brush")
        .attr("transform", `translate(0, ${innerHeight + 32})`)
        .call(brush)
        .call(brush.move, xScale.range());

    const lineGroup = brushGroup.append("g")
        .attr("class", "line-group");

    const lineGenerator = d3.line()
        .x(d => xScale(+d.Month))
        .y(d => brushYScale(+d.Value));
    
    lineGroup.append("path")
        .datum(DATA)  
        .attr("class", "line line--small") 
        .attr("d", lineGenerator);
}

function brushed() {
    const selection = d3.event.selection;
    const bisect = d3.bisector(d => +d.Month).right;
    const selectionData = selection.map((x, i) => {
        const x0 = xScale.invert(x);
        const index = bisect(DATA, x0);
        let d = DATA[index];
        let d0 = DATA[index - 1];

        if (i === 0) {
            if (d && d0) {
                return x0 <= +d0.Month ? d0 : d;
            }
        }

        return d0 || d;
    });

    drawAverageLine(selectionData);
}



function drawAverageLine(selectionData) {
    let averageGroup = rootGroup.select("g.average");
    if (averageGroup.empty()) {
        averageGroup = rootGroup.append("g")
            .attr("class", "average");
        averageGroup.append("line")
            .attr("class", "line line--average");
        averageGroup.append("text");
    }
    let averageLine = averageGroup.select("line.line--average");

    let averageYData = null;
    startIndex = DATA.findIndex(d => d.Month === selectionData[0].Month);
    endIndex = DATA.findIndex(d => d.Month === selectionData[1].Month);

    let average = getAverage();

    if (Number.isNaN(average) || !Number.isFinite(average)) {
        averageLine
            .attr("visibility", "hidden");
    } else {
        averageLine
            .attr("y1", yScale(average))
            .attr("y2", yScale(average))
            .transition()
                .duration(750)
            .attr("x1", xScale(+selectionData[0].Month))
            .attr("x2", xScale(+selectionData[1].Month))
            .attr("visibility", "visible");

        averageGroup.select("text")
            .transition()
                .delay(50)
                .duration(500)
            .attr("x", xScale(+selectionData[0].Month) + 4)
            .attr("y", yScale(average) - 8)
            .text(`Average: ${average.toLocaleString()}`);

        handleDeviation();
    }
}

/**
 * Handle deviation event
 */

function handleDeviation() {
    toggleDeviation(deviationEl.checked);
}

function toggleDeviation(isHighlight) {
    const dots = dotGroup.selectAll(".dot");
    
    if (isHighlight) {
        const average = getAverage();
        const doubledAverage = average * 2;

        dots.each(function (d, i) {
            const highlight = i >= startIndex && i <= endIndex && +d.Value >= doubledAverage;
            d3.select(this)
                .classed("dot--highlight", highlight);
        });
    } else {
        dots.classed("dot--highlight", false);
    }

}

function getAverage() {
    let selectionArray = DATA
        .filter((d, i) => (i >= startIndex) && (i <= endIndex));
    let total = selectionArray.reduce((total, d) => total + (+d.Value), 0);
    let average = total / selectionArray.length;

    return average;
}


