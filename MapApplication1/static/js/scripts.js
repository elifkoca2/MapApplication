// Map initialization
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([35.2433, 39.1436]),
        zoom: 6
    })
});

const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
map.addLayer(vectorLayer);

const format = new ol.format.WKT();

const pointStyle = new ol.style.Style({
    image: new ol.style.Icon({
        anchor: [0.5, 1],
        src: '/static/img/icon.png',
        scale: 0.1
    })
});

const polygonStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'blue',
        width: 3
    }),
    fill: new ol.style.Fill({
        color: 'rgba(0, 0, 255, 0.3)' 
    })
});

let currentPanel;

async function loadFeatures() {
    try {
        const [pointResponse, polygonResponse] = await Promise.all([
            fetch('/api/point'),
            fetch('/api/polygon')
        ]);

        if (!pointResponse.ok || !polygonResponse.ok) {
            throw new Error('Network response was not ok');
        }

        const [points, polygons] = await Promise.all([
            pointResponse.json(),
            polygonResponse.json()
        ]);

        vectorSource.clear();

        points.forEach(point => {
            const feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([point.x, point.y])),
                name: point.name
            });
            feature.setId(`point-${point.id}`);
            feature.setStyle(pointStyle);
            vectorSource.addFeature(feature);
        });

        polygons.forEach(polygon => {
            if (polygon.wkt) {
                const feature = format.readFeature(polygon.wkt, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                feature.setId(`polygon-${polygon.id}`);
                feature.set('name', polygon.name);
                feature.setStyle(polygonStyle);
                vectorSource.addFeature(feature);
            } else {
                console.warn('WKT data is missing for polygon:', polygon);
            }
        });

        Toastify({
            text: "Features loaded successfully",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#28a745"
            }
        }).showToast();
    } catch (error) {
        console.error('Error loading features:', error);
        Toastify({
            text: "Error loading features",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}



window.addEventListener('DOMContentLoaded', loadFeatures);

function addPolygon() {
    const draw = new ol.interaction.Draw({
        source: vectorSource,
        type: 'Polygon'
    });

    draw.on('drawend', function (event) {
        const feature = event.feature;
        const geometry = feature.getGeometry();
        const wkt = format.writeGeometry(geometry, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        feature.setId(`polygon-${Date.now()}`); 
        feature.setStyle(polygonStyle);

        vectorSource.addFeature(feature);

        currentPanel = jsPanel.create({
            position: 'center',
            contentSize: '400 300',
            headerTitle: 'Polygon Details',
            content: `
                <form id="polygonForm">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name"><br><br>
                    <label for="wkt">WKT:</label>
                    <textarea id="wkt" name="wkt" readonly>${wkt}</textarea><br><br>
                    <button type="button" onclick="savePolygon(event)">Save</button>
                </form>
            `,
            callback: function () {
                this.content.querySelector('form').addEventListener('submit', function (event) {
                    event.preventDefault();
                    savePolygon(event);
                });
            }
        });
    });

    map.addInteraction(draw);
}

async function savePolygon(event) {
    event.preventDefault();
    const form = document.getElementById('polygonForm');
    if (!form) {
        console.error('Form not found');
        return;
    }

    const name = form.elements['name'].value;
    const wkt = form.elements['wkt'].value;

    if (name && wkt) {
        try {
            const response = await fetch('/api/polygon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, wkt })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            console.log('Polygon saved:', result);

            Toastify({
                text: "Polygon saved successfully",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "#28a745"
                }
            }).showToast();

            if (currentPanel) {
                currentPanel.close();
            }

            loadFeatures();
        } catch (error) {
            console.error('Error saving polygon:', error);
            Toastify({
                text: "Error saving polygon",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: "#dc3545"
                }
            }).showToast();
        }
    } else {
        alert('Name and WKT are required');
    }
}


function addPoint() {
    const draw = new ol.interaction.Draw({
        source: vectorSource,
        type: 'Point'
    });

    draw.on('drawend', function (event) {
        const feature = event.feature;
        const coordinates = feature.getGeometry().getCoordinates();
        const [lon, lat] = ol.proj.toLonLat(coordinates);

        feature.setId(`point-${Date.now()}`);
        feature.setStyle(pointStyle);

        vectorSource.addFeature(feature);

        const formContent = `
            <form id="pointForm">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name"><br><br>
                <label for="coordinates">Coordinates:</label>
                <input type="text" id="coordinates" name="coordinates" value="${lon},${lat}" readonly><br><br>
                <button type="button" onclick="savePoint(event)">Save</button>
            </form>
        `;

        currentPanel = jsPanel.create({
            position: 'center',
            contentSize: '400 300',
            headerTitle: 'Point Details',
            content: formContent,
            callback: function (panel) {
                map.removeInteraction(draw);
            }
        });
    });

    map.addInteraction(draw);
}


async function savePoint(event) {
    event.preventDefault();

    const form = document.getElementById('pointForm');
    const name = form.name.value;
    const coordinates = form.coordinates.value.split(',');

    try {
        const response = await fetch('/api/point', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, x: parseFloat(coordinates[0]), y: parseFloat(coordinates[1]) })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        Toastify({
            text: "Point saved successfully",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#28a745"
            }
        }).showToast();

        vectorSource.clear();
        loadFeatures();

        if (currentPanel) {
            currentPanel.close();
            currentPanel = null;
        }

    } catch (error) {
        console.error('Error saving point:', error);
        Toastify({
            text: "Error saving point",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}



async function queryPoints() {
    try {
        const response = await fetch('/api/point');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const points = await response.json();

        currentPanel = jsPanel.create({
            position: 'center',
            contentSize: '600 400',
            headerTitle: 'Points',
            content: `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Coordinates</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${points.map(point => `
                            <tr id="point-${point.id}">
                                <td>${point.name}</td>
                                <td>${point.x}, ${point.y}</td>
                                <td class="actions">
                                    <button onclick="editPoint(${point.id})">Edit</button>
                                    <button onclick="deletePoint(${point.id})">Delete</button>
                                    <button onclick="showPoint(${point.x}, ${point.y})">Show</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `
        });

    } catch (error) {
        console.error('Error querying points:', error);
        Toastify({
            text: "Error querying points",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}

function showPoint(lon, lat) {
    const coordinates = ol.proj.fromLonLat([lon, lat]);

    if (currentPanel) {
        currentPanel.close(); 
        currentPanel = null; 

        setTimeout(() => {
            map.getView().animate({
                center: coordinates,
                zoom: 12,    
                duration: 1000
            });
        }, 500); 
    } else {
        map.getView().animate({
            center: coordinates,
            zoom: 15,    
            duration: 1000
        });
    }
}


async function queryPolygons() {
    try {
        const response = await fetch('/api/polygon');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const polygons = await response.json();

        const panel = jsPanel.create({
            position: 'center',
            contentSize: '600 400',
            headerTitle: 'Polygons',
            content: `
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>WKT</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${polygons.map(polygon => `
                            <tr id="polygon-${polygon.id}">
                                <td>${polygon.name}</td>
                                <td>${polygon.wkt}</td>
                                <td class="actions">
                                    <button onclick="editPolygon(${polygon.id})">Edit</button>
                                    <button onclick="deletePolygon(${polygon.id})">Delete</button>
                                    <button onclick="showPolygon(${polygon.id}, '${polygon.wkt}', this)">Show</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `
        });

        window.showPolygon = function (id, wkt, button) {
            panel.close();

            zoomToPolygon(wkt);
        };

    } catch (error) {
        console.error('Error querying polygons:', error);
        Toastify({
            text: "Error querying polygons",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}

function zoomToPolygon(wkt) {
    try {
        const format = new ol.format.WKT();
        let polygon = format.readGeometry(wkt);

        polygon = polygon.transform('EPSG:4326', 'EPSG:3857');

        const extent = polygon.getExtent();
        map.getView().fit(extent, { duration: 1000 });

        console.log(`Zooming to polygon with WKT: ${wkt}`);
    } catch (error) {
        console.error("Error zooming to polygon:", error);
    }
}

async function editPoint(id) {
    try {
        const response = await fetch(`/api/point/${id}`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const point = await response.json();

        currentPanel = jsPanel.create({
            position: 'center',
            contentSize: '400 300',
            headerTitle: 'Edit Point',
            content: `
                <form id="editPointForm">
                    <input type="hidden" id="id" name="id" value="${point.id}">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" value="${point.name}"><br><br>
                    <label for="coordinates">Coordinates:</label>
                    <input type="text" id="coordinates" name="coordinates" value="${point.x},${point.y}" readonly><br><br>
                    <button type="button" onclick="updatePoint(event)">Update</button>
                </form>
            `
        });

    } catch (error) {
        console.error('Error editing point:', error);
        Toastify({
            text: "Error editing point",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}

async function updatePoint(event) {
    event.preventDefault();

    const form = document.getElementById('editPointForm');
    const id = form.id.value;
    const name = form.name.value;
    const coordinates = form.coordinates.value.split(',');
    const x = coordinates[0];
    const y = coordinates[1];

    try {
        const response = await fetch(`/api/point/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, x, y })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        Toastify({
            text: "Point updated successfully",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#28a745"
            }
        }).showToast();

        vectorSource.clear();
        loadFeatures();

        if (currentPanel) {
            currentPanel.close();
            currentPanel = null;
        }

    } catch (error) {
        console.error('Error updating point:', error);
        Toastify({
            text: "Error updating point",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}


async function deletePoint(id) {
    if (!confirm('Are you sure you want to delete this point?')) return;

    try {
        const response = await fetch(`/api/point/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        Toastify({
            text: "Point deleted successfully",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#28a745"
            }
        }).showToast();

        const feature = vectorSource.getFeatureById(`point-${id}`);
        if (feature) {
            vectorSource.removeFeature(feature);
        }

        const row = document.getElementById(`point-${id}`);
        if (row) {
            row.remove();
        }

    } catch (error) {
        console.error('Error deleting point:', error);
        Toastify({
            text: "Error deleting point",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}

async function editPolygon(id) {
    try {
        const response = await fetch(`/api/polygon/${id}`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const polygon = await response.json();

        currentPanel = jsPanel.create({
            position: 'center',
            contentSize: '400 300',
            headerTitle: 'Edit Polygon',
            content: `
                <form id="editPolygonForm">
                    <input type="hidden" id="id" name="id" value="${polygon.id}">
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" value="${polygon.name}"><br><br>
                    <label for="wkt">WKT:</label>
                    <input type="text" id="wkt" name="wkt" value="${polygon.wkt}" readonly><br><br>
                    <button type="button" onclick="updatePolygon(event)">Update</button>
                </form>
            `
        });

    } catch (error) {
        console.error('Error editing polygon:', error);
        Toastify({
            text: "Error editing polygon",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}

async function updatePolygon(event) {
    event.preventDefault();

    const form = document.getElementById('editPolygonForm');
    const id = form.id.value;
    const name = form.name.value;

    try {
        const response = await fetch(`/api/polygon/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        Toastify({
            text: "Polygon updated successfully",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#28a745"
            }
        }).showToast();

        vectorSource.clear();
        loadFeatures();

        if (currentPanel) {
            currentPanel.close();
            currentPanel = null;
        }

    } catch (error) {
        console.error('Error updating polygon:', error);
        Toastify({
            text: "Error updating polygon",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}


async function deletePolygon(id) {
    if (!confirm('Are you sure you want to delete this polygon?')) return;

    try {
        const response = await fetch(`/api/polygon/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        Toastify({
            text: "Polygon deleted successfully",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#28a745"
            }
        }).showToast();

        const feature = vectorSource.getFeatureById(`polygon-${id}`);
        if (feature) {
            vectorSource.removeFeature(feature);
        }

        const row = document.getElementById(`polygon-${id}`);
        if (row) {
            row.remove();
        }

    } catch (error) {
        console.error('Error deleting polygon:', error);
        Toastify({
            text: "Error deleting polygon",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#dc3545"
            }
        }).showToast();
    }
}
let pointInteraction, polygonInteraction;

function toggleEditMode(mode) {
    console.log(`Toggling edit mode: ${mode}`);

    if (mode === 'point') {
        if (currentEditMode === 'point') {
            currentEditMode = '';
            console.log('Point edit mode disabled');
            map.removeInteraction(pointInteraction);

        } else {
            currentEditMode = 'point';
            console.log('Point edit mode enabled');
            pointInteraction = new ol.interaction.Modify({
                features: new ol.Collection([selectedFeature]), 
            });
            map.addInteraction(pointInteraction);

            pointInteraction.on('change:features', function (event) {
                const modifiedFeature = event.features.getArray()[0];
                updateFeaturePosition(modifiedFeature);
            });
        }
    } else if (mode === 'polygon') {
        if (currentEditMode === 'polygon') {
            currentEditMode = '';
            console.log('Polygon edit mode disabled');
            map.removeInteraction(polygonInteraction);
        } else {
            currentEditMode = 'polygon';
            console.log('Polygon edit mode enabled');
            polygonInteraction = new ol.interaction.Modify({
                features: new ol.Collection([selectedFeature]), 
            });
            map.addInteraction(polygonInteraction);

            polygonInteraction.on('change:features', function (event) {
                const modifiedFeature = event.features.getArray()[0];
                updateFeaturePosition(modifiedFeature);
            });
        }
    }
}

function updateFeaturePosition(feature) {
    const newCoordinates = feature.getGeometry().getCoordinates();
    console.log('New coordinates:', newCoordinates);
}



document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('addPolygon').addEventListener('click', addPolygon);
    document.getElementById('addPoint').addEventListener('click', addPoint);
    document.getElementById('queryPoints').addEventListener('click', queryPoints);
    document.getElementById('queryPolygons').addEventListener('click', queryPolygons);
    
});

document.getElementById('togglePointEdit').addEventListener('click', () => {
    toggleEditMode('point');
});


document.getElementById('togglePolygonEdit').addEventListener('click', () => {
    toggleEditMode('polygon');
});