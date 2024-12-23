DFS Simulation with Cytoscape.js

This project demonstrates the use of Cytoscape.js to simulate graph traversal algorithms like DFS, BFS, A\*, and more. The interface allows users to select algorithms, layouts, and stylesheets dynamically while visualizing the graph in real-time.

Features

Graph Algorithms: Simulate BFS, DFS, A\*, and other algorithms.

Layouts for graph display:

Concentric by Centrality

Force-directed (Cola)

Hierarchy by Centrality

Algorithm simulations:

Breadth-First Search (BFS)

Depth-First Search (DFS)

Max Distance

A\* Search Algorithm

Support for switching datasets and stylesheets.

Responsive design suitable for various screen sizes.

Technologies Used

Cytoscape.js: For graph visualization.

WebCola.js: For force-directed layouts.

jQuery: For DOM manipulation.

HTML/CSS: For layout and styling.

JavaScript: For logic implementation.

Project Structure

├── index.html # Main HTML file
├── index.js # JavaScript file for application logic
├── README.md # Project documentation
├── plain.json # Example stylesheet for Cytoscape.js
├── race.json # Example dataset: Race
├── transportation.json # Example dataset: Transportation

Setup and Usage

Prerequisites

Ensure you have the following installed:

A modern web browser (Chrome, Firefox, Edge, etc.).

A local web server if needed (e.g., Live Server for VS Code).

Steps to Run

Clone the repository or download the project files.

git clone <repository-url>
cd <repository-folder>

Usage

Select a dataset from the "Active Dataset" dropdown.

Choose a graph style and layout from the respective dropdowns.

Select an algorithm to visualize from the "Select Algorithm" dropdown.

If required, specify the start and end nodes, as well as the max distance.

Click "Run Algorithm" to start the visualization.

Dataset Structure

Datasets should be in JSON format compatible with Cytoscape.js. Example:

{
"nodes": [
{ "data": { "id": "a", "name": "Node A" } },
{ "data": { "id": "b", "name": "Node B" } }
],
"edges": [
{ "data": { "source": "a", "target": "b" } }
]
}

Adding a New Dataset

Create a JSON file following the dataset structure.

Place the file in the project directory.

Add an option to the #data dropdown in index.html:

<option value="your-dataset.json">Your Dataset</option>

Styles

To modify the graph's appearance, update the plain.json stylesheet or create a new one. Add it to the #style dropdown in index.html:

<option value="your-style.json">Your Style</option>

Algorithms

Implement custom algorithms in index.js and add them to the #algorithm dropdown. Example:

<option value="your-algorithm">Your Algorithm</option>

Responsive Design

The control panel is fully responsive and adjusts for smaller screens.

Inputs and buttons resize dynamically to fit available space.

License

This project is open-source. You can modify and distribute it freely under the MIT License.

Acknowledgments

Thanks to the developers of Cytoscape.js for the powerful graph visualization library.

Inspired by various graph theory and visualization tools.
