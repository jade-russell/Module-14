// Global variable to store data
let globalData = null;
 
// Add file input listener
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Show loading indicator
        document.getElementById('loadingIndicator').style.display = 'block';
 
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                globalData = JSON.parse(event.target.result);
                // Hide loading indicator and show dashboard
                document.getElementById('loadingIndicator').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                // Initialize dashboard with the loaded data
                initializeDashboard();
            } catch (error) {
                alert('Error reading file: ' + error.message);
                document.getElementById('loadingIndicator').style.display = 'none';
            }
        };
        reader.readAsText(file);
    }
});
 
// Initialize the dashboard with loaded data
function initializeDashboard() {
    if (!globalData) return;
 
    // Populate the dropdown
    let selector = d3.select("#selDataset");
    selector.html(""); // Clear existing options
 
    globalData.names.forEach((sample) => {
        selector
            .append("option")
            .text(sample)
            .property("value", sample);
    });
 
    // Use the first sample to build initial plots
    const firstSample = globalData.names[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
}
 
// Function to update metrics
function updateMetrics(sampleData) {
    const totalSamples = sampleData.sample_values.length;
    const uniqueBacteria = new Set(sampleData.otu_ids).size;
    const avgValue = Math.round(sampleData.sample_values.reduce((a, b) => a + b) / totalSamples);
    const maxValue = Math.max(...sampleData.sample_values);
 
    // Update metric displays with animation
    animateValue("totalSamples", 0, totalSamples, 1000);
    animateValue("uniqueBacteria", 0, uniqueBacteria, 1000);
    animateValue("avgValue", 0, avgValue, 1000);
    animateValue("maxValue", 0, maxValue, 1000);
}
 
// Function to animate number changes
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);
 
    let current = start;
    const step = Math.sign(range);
 
    function updateNumber() {
        current += step;
        obj.innerHTML = current.toLocaleString();
        if (current != end) {
            setTimeout(updateNumber, stepTime);
        }
    }
 
    setTimeout(updateNumber, stepTime);
}
 
// Function to build metadata panel
function buildMetadata(sample) {
    if (!globalData) return;
 
    let metadata = globalData.metadata;
    let resultArray = metadata.filter(sampleObj => sampleObj.id == sample);
    let result = resultArray[0];
    let PANEL = d3.select("#sample-metadata");
 
    // Clear existing metadata
    PANEL.html("");
 
    // Add each key-value pair with animation
    Object.entries(result).forEach(([key, value], index) => {
        setTimeout(() => {
            PANEL.append("h6")
                .style("opacity", 0)
                .text(`${key.toUpperCase()}: ${value}`)
                .transition()
                .duration(500)
                .style("opacity", 1);
        }, index * 100);
    });
 
    // Build gauge chart
    buildGaugeChart(result.wfreq);
}
 
// Function to build gauge chart
function buildGaugeChart(wfreq) {
    let gaugeData = [{
        domain: { x: [0, 1], y: [0, 1] },
        value: wfreq,
        title: { text: "Belly Button Washing Frequency<br>Scrubs per Week" },
        type: "indicator",
        mode: "gauge+number",
        gauge: {
            axis: { range: [null, 9] },
            bar: { color: "darkblue" },
            steps: [
                { range: [0, 1], color: "#f8f3ec" },
                { range: [1, 2], color: "#f4f1e4" },
                { range: [2, 3], color: "#e9e6ca" },
                { range: [3, 4], color: "#e5e7b2" },
                { range: [4, 5], color: "#d5e49d" },
                { range: [5, 6], color: "#b7cc8f" },
                { range: [6, 7], color: "#8cbf88" },
                { range: [7, 8], color: "#8abb8f" },
                { range: [8, 9], color: "#85b48a" }
            ],
            threshold: {
                line: { color: "red", width: 4 },
                thickness: 0.75,
                value: wfreq
            }
        }
    }];
 
    let gaugeLayout = {
        width: 350,
        height: 300,
        margin: { t: 25, r: 25, l: 25, b: 25 }
    };
 
    Plotly.newPlot('gauge', gaugeData, gaugeLayout);
}
 
// Function to build all charts
function buildCharts(sample) {
    if (!globalData) return;
 
    let samples = globalData.samples;
    let resultArray = samples.filter(sampleObj => sampleObj.id == sample);
    let result = resultArray[0];
 
    // Update metrics
    updateMetrics(result);
 
    let otu_ids = result.otu_ids;
    let otu_labels = result.otu_labels;
    let sample_values = result.sample_values;
 
    // Bar Chart
    let barData = [{
        y: otu_ids.slice(0, 10).map(otuID => `OTU ${otuID}`).reverse(),
        x: sample_values.slice(0, 10).reverse(),
        text: otu_labels.slice(0, 10).reverse(),
        type: "bar",
        orientation: "h",
        marker: {
            color: 'rgb(31, 119, 180)',
            opacity: 0.8
        }
    }];
 
    let barLayout = {
        title: "Top 10 Bacteria Cultures Found",
        margin: { t: 30, l: 150 },
        xaxis: { title: "Sample Values" },
        yaxis: { automargin: true }
    };
 
    Plotly.newPlot("bar", barData, barLayout);
 
    // Bubble Chart with improved visualization
    let bubbleData = [{
        x: otu_ids,
        y: sample_values,
        text: otu_labels,
        mode: 'markers',
        marker: {
            size: sample_values,
            sizeref: 2 * Math.max(...sample_values) / (45**2),
            sizemode: 'area',
            color: otu_ids,
            colorscale: 'Earth',
            showscale: true,
            colorbar: { title: 'OTU ID' }
        }
    }];
 
    let bubbleLayout = {
        title: 'Bacteria Cultures Per Sample',
        xaxis: { title: 'OTU ID' },
        yaxis: { title: 'Sample Values' },
        showlegend: false,
        height: 600,
        margin: { t: 30 },
        hovermode: 'closest'
    };
 
    Plotly.newPlot('bubble', bubbleData, bubbleLayout);
 
    // Pie Chart
    let pieData = [{
        values: sample_values.slice(0, 5),
        labels: otu_ids.slice(0, 5).map(id => `OTU ${id}`),
        text: otu_labels.slice(0, 5),
        type: 'pie',
        hole: 0.4,
        hoverinfo: 'label+percent+text',
        textinfo: 'percent',
        marker: {
            colors: ['rgb(31, 119, 180)', 'rgb(255, 127, 14)', 
                    'rgb(44, 160, 44)', 'rgb(214, 39, 40)', 
                    'rgb(148, 103, 189)']
        }
    }];
 
    let pieLayout = {
        title: 'Top 5 Bacteria Distribution',
        height: 400,
        margin: { t: 30, l: 30, r: 30, b: 30 },
        showlegend: true
    };
 
    Plotly.newPlot('pie', pieData, pieLayout);
}
 
// Function to handle dropdown changes
function optionChanged(newSample) {
    buildCharts(newSample);
    buildMetadata(newSample);
}
 
// Initial setup - hide dashboard until data is loaded
document.getElementById('dashboard').style.display = 'none';